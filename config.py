# Neo4j Configuration Template
# Copy this file to config.py and fill in your Neo4j Aura credentials

# Neo4j Aura Connection Details
# Get these from your Neo4j Aura dashboard: https://console.neo4j.io/

NEO4J_URI = "neo4j+s://your-instance-id.databases.neo4j.io"
NEO4J_USER = "neo4j"  # Usually 'neo4j' for Aura instances
NEO4J_PASSWORD = "your-generated-password-here"

# Import Settings
DATA_DIR = "fourth jsons"
BATCH_SIZE = 100  # Number of questions to import at once
CLEAR_DATABASE = True  # Set to False to keep existing data

# Security Note:
# - Never commit config.py to version control
# - Add config.py to your .gitignore file
# - Keep your credentials secure and rotate them regularly
