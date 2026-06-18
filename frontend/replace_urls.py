import os
import re

# Replace all localhost:5000 with Render URL
render_url = "https://library-management-system-ih9d.onrender.com"

for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Replace all instances
            updated = content.replace(
                "http://localhost:5000",
                render_url
            )
            
            if updated != content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(updated)
                print(f"Updated: {filepath}")

print("All URLs replaced!")
