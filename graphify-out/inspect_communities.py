import json
from pathlib import Path

def main():
    analysis = json.loads(Path('graphify-out/.graphify_analysis.json').read_text(encoding="utf-8"))
    extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding="utf-8"))
    
    # Map node id to label
    node_labels = {n['id']: n['label'] for n in extraction['nodes']}
    
    for cid, node_ids in analysis['communities'].items():
        print(f"--- Community {cid} ---")
        for nid in node_ids:
            print(f"  {nid}: {node_labels.get(nid, nid)}")

if __name__ == '__main__':
    main()
