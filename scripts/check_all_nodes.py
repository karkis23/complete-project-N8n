import json

workflow_path = "C:/Users/madhu/.gemini/antigravity/brain/5326c207-48d3-46e9-accf-377e9a73250e/.system_generated/steps/15/output.txt"
with open(workflow_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

nodes = data['data']['nodes']
with open("all_nodes_out.txt", "w", encoding="utf-8") as f:
    for node in nodes:
        if node['type'] == 'n8n-nodes-base.supabase':
            f.write(f"\nNode: {node['name']} (id: {node['id']})\n")
            table = node['parameters'].get('tableId')
            f.write(f"Table: {table}\n")
            
            fields_ui = node['parameters'].get('fieldsUi', {})
            fields = fields_ui.get('fieldValues', [])
            for i, field in enumerate(fields):
                fid = field.get('fieldId')
                fval = field.get('fieldValue')
                if not fid:
                    f.write(f"  [{i}] EMPTY FIELD ID! value='{fval}'\n")
                elif fid.strip() == '':
                    f.write(f"  [{i}] BLANK/SPACE FIELD ID! value='{fval}'\n")
            f.write(f"Total fields: {len(fields)}\n")
