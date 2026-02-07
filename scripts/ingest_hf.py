#!/usr/bin/env python3
import os
import json
import uuid
import argparse
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

# Standard SO-100 Joint Names
JOINT_NAMES = [
    "shoulder_pan",
    "shoulder_lift",
    "elbow_flex",
    "wrist_flex",
    "wrist_roll",
    "gripper"
]

def ingest_hf_dataset(dataset_path, output_dir):
    """
    Ingest a LeRobot v3.0 format dataset.
    """
    dataset_path = Path(dataset_path)
    info_path = dataset_path / "meta" / "info.json"
    
    if not info_path.exists():
        print(f"Skipping {dataset_path}: No meta/info.json found.")
        return None

    print(f"Processing HF dataset {dataset_path.name}...")

    with open(info_path, 'r') as f:
        info = json.load(f)

    fps = info.get("fps", 30)
    
    # Create Dataset ID based on folder name or UUID
    dataset_id = dataset_path.name.replace(".", "_")
    dataset_dir = output_dir / dataset_id
    dataset_dir.mkdir(parents=True, exist_ok=True)

    # Find all parquet files in data/
    data_dir = dataset_path / "data"
    parquet_files = sorted(list(data_dir.glob("**/file-*.parquet")))
    
    if not parquet_files:
        print(f"No parquet files found in {data_dir}")
        return None

    all_episodes = []
    
    # Load all dataframes and combine or process per file
    # For LeRobot v3.0, episodes can span multiple files or one file can have multiple episodes.
    # Usually they are split by episode_index.
    
    episode_data_map = {} # episode_index -> list of rows

    for pq_path in parquet_files:
        try:
            df = pd.read_parquet(pq_path)
            if "episode_index" not in df.columns:
                # If no episode_index, assume all belongs to episode 0 (unlikely in v3.0)
                df["episode_index"] = 0
            
            for ep_idx, ep_df in df.groupby("episode_index"):
                if ep_idx not in episode_data_map:
                    episode_data_map[ep_idx] = []
                episode_data_map[ep_idx].append(ep_df)
        except Exception as e:
            print(f"Error reading {pq_path}: {e}")

    episodes_in_manifest = []

    for ep_idx in sorted(episode_data_map.keys()):
        ep_dfs = episode_data_map[ep_idx]
        full_ep_df = pd.concat(ep_dfs).sort_values("timestamp")
        
        ep_id = f"episode_{ep_idx:03d}"
        
        joint_positions = []
        timestamps = []
        
        for i, row in full_ep_df.iterrows():
            action = row["action"]
            if isinstance(action, np.ndarray):
                action = action.tolist()
            elif hasattr(action, 'tolist'):
                 action = action.tolist()
            
            # Ensure 6 joints (SO-100)
            if isinstance(action, list) and len(action) >= 6:
                joints = [float(x) for x in action[:6]]
                
                # Normalization logic for different SO-100 conventions
                # 'so100' (official LeRobot) vs 'bi_so100_follower' (Telegrip/Community)
                if info.get("robot_type") == "so100":
                    # Many official datasets store joints 1-4 with a 180-degree center
                    # We normalize them to the [-180, 180] range centered at 0
                    for j_idx in [1, 2, 3, 4]: 
                        if joints[j_idx] > 90:
                            joints[j_idx] -= 180
                            
                    # Gripper normalization: check if it's 0-1 (common in HF datasets)
                    # SO-100 gripper in Telegrip is usually degrees (~0-60)
                    if joints[5] >= 0 and joints[5] <= 1.0:
                        # Scale 0-1 to something more visible in the viewer if needed, 
                        # but often 0-1 works if interpreted as radians or if the model maps it.
                        # For now, let's keep it as is but note the difference.
                        pass

                joint_positions.append(joints)
                timestamps.append(round(float(row["timestamp"]), 3))

        if not joint_positions:
            continue

        episode_json = {
            "robot": "so100",
            "episode_id": ep_id,
            "timestamps": timestamps,
            "joint_names": JOINT_NAMES,
            "joint_positions": joint_positions,
            "fps": fps,
            "metadata": {
                "source": str(dataset_path),
                "duration": timestamps[-1] - timestamps[0] if timestamps else 0,
                "frame_count": len(timestamps)
            }
        }

        # Write Episode JSON
        output_file = dataset_dir / f"{ep_id}.json"
        with open(output_file, 'w') as f:
            json.dump(episode_json, f)
        
        episodes_in_manifest.append({
            "id": ep_id,
            "file": f"datasets/{dataset_id}/{ep_id}.json",
            "duration": episode_json["metadata"]["duration"],
            "frameCount": episode_json["metadata"]["frame_count"]
        })

    if not episodes_in_manifest:
        return None

    return {
        "id": dataset_id,
        "title": dataset_path.name.replace("_", " ").title(),
        "description": f"HuggingFace dataset from {dataset_path.parent.name}/{dataset_path.name}",
        "sourceType": "huggingface",
        "sourceId": f"{dataset_path.parent.name}/{dataset_path.name}",
        "isPremium": False,
        "createdAt": datetime.now().isoformat(),
        "episodes": episodes_in_manifest
    }

def main():
    parser = argparse.ArgumentParser(description="Ingest HF datasets for SO-100 Motion Exchange")
    parser.add_argument("--source", required=True, help="Input directory path containing author/dataset_id folders")
    parser.add_argument("--output", default="datasets", help="Output directory for processed JSONs")
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)
    
    manifest_path = output_dir / "manifest.json"
    manifest = []
    if manifest_path.exists():
        with open(manifest_path, 'r') as f:
            try:
                manifest = json.load(f)
            except:
                pass

    source_root = Path(args.source)
    
    # We expect source_root/author/dataset_name/meta/info.json
    for author_dir in source_root.iterdir():
        if author_dir.is_dir():
            for dataset_dir in author_dir.iterdir():
                if dataset_dir.is_dir():
                    if (dataset_dir / "meta" / "info.json").exists():
                        dataset_info = ingest_hf_dataset(dataset_dir, output_dir)
                        if dataset_info:
                            # Check if already in manifest by sourceId
                            manifest = [m for m in manifest if m.get("sourceId") != dataset_info["sourceId"]]
                            manifest.append(dataset_info)

    # Save Manifest
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Done. Manifest updated at {manifest_path}")

if __name__ == "__main__":
    main()
