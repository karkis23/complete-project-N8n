import json
workflow_path = "C:/Users/madhu/.gemini/antigravity/brain/5326c207-48d3-46e9-accf-377e9a73250e/.system_generated/steps/15/output.txt"
with open(workflow_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

nodes = data['data']['nodes']
supabase_node = next((n for n in nodes if n['name'] == 'Log Signal to Supabase'), None)
fields = supabase_node['parameters']['fieldsUi']['fieldValues']

with open('fields_out.txt', 'w', encoding='utf-8') as f:
    for field in fields:
        f.write(f"'{field.get('fieldId')}' : '{field.get('fieldValue')}'\n")
