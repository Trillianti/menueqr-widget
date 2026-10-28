# Security

Please do not open a public issue containing an exploit, guest data or credentials. Report suspected vulnerabilities privately to **support@menueqr.de** with reproduction steps and the affected version. Remove secrets and personal data from logs and screenshots.

This repository contains a browser integration SDK and a fictional local preview. It does not contain the MenüQR backend. The hosted service enforces restaurant access, allowed origins, availability and reservation acceptance.

The SDK validates its configuration and iframe message origin/source, uses a sandboxed frame, and requires no private API key. Host websites remain responsible for their own CSP, privacy disclosures and safe handling of any data outside the widget.

During the MVP stage, fixes target the latest published `0.x` release. Do not assume older releases receive backported fixes.
