import json

with open("updated_workflow.json", "r", encoding="utf-8") as f:
    data = json.load(f)

nodes = data['nodes']
supabase_node = next((n for n in nodes if n['name'] == 'Log Signal to Supabase'), None)

operations = [{
    "type": "updateNode",
    "nodeName": "Log Signal to Supabase",
    "nodeConfig": supabase_node
}]

with open("operations.json", "w", encoding="utf-8") as f:
    json.dump(operations, f, indent=2)

print("Created operations.json")
