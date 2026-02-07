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

def ingest_directory(source_path, output_dir, source_type="local"):
    """
    Ingest a directory containing lerobot_frames.parquet and meta.json.
    """
    source_path = Path(source_path)
    parquet_path = source_path / "lerobot_frames.parquet"
    meta_path = source_path / "meta.json"

    if not parquet_path.exists():
        print(f"Skipping {source_path}: No lerobot_frames.parquet found.")
        return None

    print(f"Processing {source_path}...")

    # Load Metadata
    meta = {}
    if meta_path.exists():
        with open(meta_path, 'r') as f:
            meta = json.load(f)

    fps = meta.get("fps", 30)
    
    # Load Parquet
    try:
        df = pd.read_parquet(parquet_path)
    except Exception as e:
        print(f"Error reading parquet {parquet_path}: {e}")
        return None

    # Check for 'action' column
    if "action" not in df.columns:
        print(f"Skipping {source_path}: No 'action' column in parquet.")
        return None

    # Create Dataset ID
    dataset_id = str(uuid.uuid4())
    dataset_dir = output_dir / dataset_id
    dataset_dir.mkdir(parents=True, exist_ok=True)

    # Process Episodes
    # If the dataframe has 'episode_index', split by it. Otherwise assume single episode.
    episodes = []
    
    if "episode_index" in df.columns:
        episode_groups = df.groupby("episode_index")
    else:
        episode_groups = [(0, df)]

    for ep_idx, ep_df in episode_groups:
        ep_id = f"episode_{ep_idx:03d}"
        
        # Extract Joint Positions
        # Actions are often stored as arrays/lists in the cell
        # We need to ensure they are standard python lists of floats
        
        joint_positions = []
        timestamps = []
        
        start_time = 0.0
        
        for i, row in ep_df.iterrows():
            action = row["action"]
            if isinstance(action, np.ndarray):
                action = action.tolist()
            elif hasattr(action, 'tolist'): # Check if it's a tensor or similar
                 action = action.tolist()
            
            # Ensure 6 joints
            if len(action) == 6:
                joint_positions.append(action)
                timestamps.append(round(start_time, 3))
                start_time += (1.0 / fps)
            else:
                # Handle resizing or skipping? 
                # For MVP, fill with zeros if missing, or truncate
                 pass 

        episode_data = {
            "robot": "so100",
            "episode_id": ep_id,
            "timestamps": timestamps,
            "joint_names": JOINT_NAMES,
            "joint_positions": joint_positions,
            "fps": fps,
            "metadata": {
                "source": str(source_path),
                "duration": len(timestamps) / fps,
                "frame_count": len(timestamps),
                "original_meta": meta
            }
        }

        # Write Episode JSON
        output_file = dataset_dir / f"{ep_id}.json"
        with open(output_file, 'w') as f:
            json.dump(episode_data, f)
        
        episodes.append({
            "id": ep_id,
            "file": str(output_file.relative_to(output_dir.parent)), # Relative to repo root if possible
            "duration": episode_data["metadata"]["duration"],
            "frameCount": episode_data["metadata"]["frame_count"]
        })

    # Return Dataset Info for Manifest
    return {
        "id": dataset_id,
        "title": meta.get("repo_id", source_path.name), # Use repo_id if HF, else folder name
        "description": f"Imported from {source_type}. {len(episodes)} episodes.",
        "sourceType": source_type,
        "sourceId": str(source_path),
        "isPremium": False,
        "createdAt": datetime.now().isoformat(),
        "episodes": episodes
    }

def main():
    parser = argparse.ArgumentParser(description="Ingest datasets for SO-100 Motion Exchange")
    parser.add_argument("--source", required=True, help="Input directory path")
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

    # Recursive search for 'lerobot_frames.parquet'
    source_root = Path(args.source)
    found = False
    
    # Walk through directory
    for root, dirs, files in os.walk(source_root):
        if "lerobot_frames.parquet" in files:
            print(f"Found dataset in {root}")
            dataset_info = ingest_directory(root, output_dir)
            if dataset_info:
                manifest.append(dataset_info)
                found = True

    if not found:
        print("No datasets found. Looking for direct parquet file...")
        # Check if source itself is the dir
        if (source_root / "lerobot_frames.parquet").exists():
             dataset_info = ingest_directory(source_root, output_dir)
             if dataset_info:
                manifest.append(dataset_info)

    # Save Manifest
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Done. Manifest updated at {manifest_path}")

if __name__ == "__main__":
    main()
