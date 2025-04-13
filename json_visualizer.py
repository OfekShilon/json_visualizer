#!/usr/bin/env python3
import argparse
import json
import os
from jinja2 import Environment, FileSystemLoader

def load_json_file(file_path):
    """
    Load and parse a JSON file
    """
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except json.JSONDecodeError:
        print(f"Error: {file_path} is not a valid JSON file")
        exit(1)
    except FileNotFoundError:
        print(f"Error: File {file_path} not found")
        exit(1)

def generate_html(json_data, output_file=None):
    """
    Generate HTML visualization of JSON data using Jinja template
    """
    # Get the directory of the current script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Set up Jinja environment
    templates_dir = os.path.join(current_dir, 'templates')
    env = Environment(loader=FileSystemLoader(templates_dir))
    template = env.get_template('template.html')
    
    # Render template with json data
    html_content = template.render(json_data=json_data)
    
    # Output the HTML
    if output_file:
        with open(output_file, 'w') as f:
            f.write(html_content)
        print(f"HTML visualization saved to {output_file}")
    else:
        output_path = os.path.join(current_dir, 'output.html')
        with open(output_path, 'w') as f:
            f.write(html_content)
        print(f"HTML visualization saved to {output_path}")
        return output_path

def main():
    # Set up command line argument parser
    parser = argparse.ArgumentParser(
        description='Generate HTML visualization of JSON file as a collapsible tree'
    )
    parser.add_argument('json_file', help='Path to the JSON file to visualize')
    parser.add_argument('-o', '--output', help='Output HTML file path (optional)')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Load JSON data
    json_data = load_json_file(args.json_file)
    
    # Generate HTML visualization
    output_file = args.output
    generate_html(json_data, output_file)

if __name__ == "__main__":
    main()