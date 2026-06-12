# rptdashboard

A utility and platform for generating reporting dashboards and sending them directly via email as rich, responsive HTML newsletters or PDF attachments.

## Overview

`rptdashboard` is designed to automate the process of querying data sources (databases, APIs, CSVs), rendering the data into visually stunning dashboards, and emailing those dashboards on a scheduled basis.

## Key Features

- **Data Connectors**: Fetch data from PostgreSQL, MySQL, REST APIs, Google Sheets, etc.
- **Beautiful HTML Templates**: Generate responsive email layouts using MJML or tailwind-styled HTML.
- **Visual Dashboards**: Render charts/graphs using Chart.js, Vega-Lite, or D3.
- **PDF/Image Generation**: Convert dashboards to PDFs or PNGs using Puppeteer/Playwright.
- **Email Delivery**: Send reports using SMTP, SendGrid, Mailgun, or AWS SES.
- **Scheduling**: Run jobs periodically using cron schedules or serverless triggers.

## Proposed Technology Stack

We propose a **Node.js/TypeScript** stack for maximum flexibility with templating and headless browser rendering:
- **Language**: TypeScript / Node.js
- **Templates**: MJML / Handlebars (for responsive email templates)
- **Chart Rendering**: Puppeteer + Chart.js (to render charts to static images for email clients)
- **Email Sender**: Nodemailer (supporting SMTP, SES, etc.)

## Getting Started

*(Scaffold setup in progress)*
