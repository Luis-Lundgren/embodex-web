#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/teleop/session/ingest"

# Sample JSON payload
read -d '' PAYLOAD <<EOF
{
    "robot": "so100",
    "session_id": "cli_test_session_$(date +%s)",
    "episode_id": "episode_001",
    "fps": 30,
    "timestamps": [0.0, 0.033, 0.066, 0.1, 0.133],
    "joint_positions": [
        [0, -100, 100, 60, 0, 0],
        [0.1, -99.9, 100, 60.1, 0, 0],
        [0.2, -99.8, 100, 60.2, 0, 0],
        [0.3, -99.7, 100, 60.3, 0, 0],
        [0.4, -99.6, 100, 60.4, 0, 0]
    ],
    "metadata": {
        "duration": 0.133,
        "frame_count": 5
    }
}
EOF

# Send request
echo "Sending ingestion request to $API_URL..."
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$PAYLOAD" "$API_URL")

echo "Response:"
echo "$RESPONSE" | jq . || echo "$RESPONSE"
