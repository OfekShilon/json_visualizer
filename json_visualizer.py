#!/usr/bin/env python3
import argparse
import json
import os
import shutil
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

def generate_html(json_data, input_file, output_file=None):
    """
    Generate HTML visualization of JSON data using Jinja template
    """
    # Get the directory of the current script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Extract file name from the path
    file_name = os.path.basename(input_file)
    
    # Set up Jinja environment
    templates_dir = os.path.join(current_dir, 'templates')
    env = Environment(loader=FileSystemLoader(templates_dir))
    template = env.get_template('template.html')
    
    # Render template with json data and file name
    html_content = template.render(json_data=json_data, file_name=file_name)
    
    # Determine output path
    if output_file:
        output_path = os.path.abspath(output_file)
    else:
        output_path = os.path.join(current_dir, 'output.html')
    
    # Create output directory if it doesn't exist
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Write HTML to output file
    with open(output_path, 'w') as f:
        f.write(html_content)
    
    # Only copy static files if the output directory is different from the project directory
    src_static_dir = os.path.join(current_dir, 'static')
    dst_static_dir = os.path.join(os.path.dirname(output_path), 'static')
    
    if os.path.dirname(output_path) != current_dir:
        # Create output static directory if needed
        if not os.path.exists(dst_static_dir):
            os.makedirs(dst_static_dir)
        
        # Copy CSS directory
        src_css_dir = os.path.join(src_static_dir, 'css')
        dst_css_dir = os.path.join(dst_static_dir, 'css')
        
        if not os.path.exists(dst_css_dir):
            os.makedirs(dst_css_dir)
        
        # Copy CSS file
        src_css_file = os.path.join(src_css_dir, 'json-visualizer.css')
        dst_css_file = os.path.join(dst_css_dir, 'json-visualizer.css')
        
        if src_css_file != dst_css_file:  # Extra check to avoid copying a file to itself
            shutil.copy(src_css_file, dst_css_file)
    
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
    generate_html(json_data, args.json_file, output_file)

if __name__ == "__main__":
    main()