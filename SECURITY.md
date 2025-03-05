# Security Policy

## Security Overview

SolnAI takes security very seriously, especially given the sensitive nature of system monitoring data. Our platform is designed with security best practices in mind, including:

- End-to-end encryption for data in transit
- Fine-grained access control
- Secure credential storage
- Regular security audits
- Compliance with industry standards

## Supported Versions

The following versions of SolnAI are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| 0.9.x   | :white_check_mark: |
| < 0.9.0 | :x:                |

## Security Features

### Data Protection

- All metrics and log data is encrypted in transit using TLS 1.3
- Authentication credentials are securely hashed and never stored in plaintext
- API keys use secure random generation and proper entropy
- Time-series data can be encrypted at rest (enterprise deployments)

### Access Control

- Role-based access control (RBAC) for all dashboard access
- Fine-grained permissions for viewing, editing, and administering resources
- API access requires specific scoped tokens
- Audit logging of all sensitive operations

### Collector Security

- Collectors communicate using encrypted channels only
- Mutual TLS authentication for collector-to-server communication
- Collector agents run with minimal required permissions
- Collector configuration validated server-side to prevent tampering

## Best Practices for Deployment

1. **Use HTTPS**: Always deploy SolnAI behind HTTPS in production
2. **Firewall Configuration**: Restrict access to the SolnAI server to trusted networks
3. **Regular Updates**: Keep your SolnAI installation up to date with security patches
4. **Strong Passwords**: Enforce strong password policies for all users
5. **Isolated Environment**: Deploy SolnAI in its own isolated environment when possible

## Reporting a Vulnerability

We take all security vulnerabilities seriously. Thank you for improving the security of our platform.

**Please do not report security vulnerabilities through public GitHub issues.**

### Reporting Process

1. **Email**: Send details to [security@solnai.com](mailto:security@solnai.com)
2. **Encryption**: You can use our [PGP key](https://solnai.com/security/pgp-key.asc) for secure communication
3. **Response Time**: We aim to acknowledge receipt within 24 hours
4. **Disclosure Process**: We will work with you to understand and address the issue
5. **Recognition**: We're happy to acknowledge your contribution after the issue is fixed

### What to Include

- Type of issue (buffer overflow, SQL injection, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (link to specific lines or commit)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Compliance

SolnAI helps organizations meet compliance requirements for:

- SOC 2
- HIPAA (for healthcare-related monitoring)
- PCI DSS (for payment processing environments)
- GDPR (for EU data protection)
- ISO 27001

Please contact us for detailed compliance documentation and certification information.

## Bug Bounty Program

We maintain a private bug bounty program for security researchers. To request an invitation, please email [bugbounty@solnai.com](mailto:bugbounty@solnai.com) with your experience and qualifications.