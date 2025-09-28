#!/bin/bash

# Generate self-signed SSL certificates for development
# Run this in your api/ directory

# Generate private key
openssl genrsa -out key.pem 2048

# Generate certificate
openssl req -new -x509 -key key.pem -out cert.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=ec2-65-0-19-209.ap-south-1.compute.amazonaws.com"

echo "SSL certificates generated: key.pem and cert.pem"
echo "You can now run your FastAPI app with HTTPS support"
