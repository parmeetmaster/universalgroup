import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('pakistani-serials/pages')
export class PakPagesController {
  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  privacy(): string {
    return page(
      'Privacy Policy',
      `
      <p><strong>Last updated:</strong> May 12, 2026</p>

      <h2>1. Information We Collect</h2>
      <p>Pakistani Serials ("we", "our", or "the App") collects minimal information to provide you with the best streaming experience:</p>
      <ul>
        <li><strong>Device information:</strong> Device model, operating system version, and app version for crash reporting and compatibility.</li>
        <li><strong>Usage data:</strong> Pages viewed and features used, collected anonymously to improve the App.</li>
        <li><strong>Watchlist &amp; preferences:</strong> Stored locally on your device. We do not sync or upload your watchlist to our servers.</li>
      </ul>

      <h2>2. Information We Do NOT Collect</h2>
      <ul>
        <li>We do not collect your name, email, phone number, or any personally identifiable information.</li>
        <li>We do not require account registration.</li>
        <li>We do not track your location.</li>
      </ul>

      <h2>3. How We Use Information</h2>
      <ul>
        <li>To provide and maintain the streaming service.</li>
        <li>To detect and fix technical issues.</li>
        <li>To improve app performance and user experience.</li>
      </ul>

      <h2>4. Third-Party Services</h2>
      <p>The App may use third-party services that collect information used to identify you. These include:</p>
      <ul>
        <li>Google Analytics (anonymous usage statistics)</li>
        <li>Firebase Crashlytics (crash reporting)</li>
      </ul>

      <h2>5. Data Security</h2>
      <p>We value your trust and strive to use commercially acceptable means of protecting any information. However, no method of electronic transmission or storage is 100% secure.</p>

      <h2>6. Children's Privacy</h2>
      <p>The App does not knowingly collect information from children under 13. If you believe your child has provided us with personal information, please contact us.</p>

      <h2>7. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Changes will be posted within the App. Continued use of the App after changes constitutes acceptance.</p>

      <h2>8. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:support@pakistaniserials.app">support@pakistaniserials.app</a>.</p>
      `,
    );
  }

  @Get('terms')
  @Header('Content-Type', 'text/html; charset=utf-8')
  terms(): string {
    return page(
      'Terms of Service',
      `
      <p><strong>Last updated:</strong> May 12, 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>By downloading or using Pakistani Serials ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.</p>

      <h2>2. Description of Service</h2>
      <p>The App provides a streaming platform for Pakistani dramas and entertainment content. Content availability may vary and change without notice.</p>

      <h2>3. User Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the App for any unlawful purpose.</li>
        <li>Attempt to reverse-engineer, decompile, or disassemble the App.</li>
        <li>Redistribute, re-stream, or record content from the App.</li>
        <li>Interfere with or disrupt the App's servers or networks.</li>
      </ul>

      <h2>4. Intellectual Property</h2>
      <p>All content, trademarks, and data on the App are the property of their respective owners. You are granted a limited, non-exclusive, non-transferable license to use the App for personal, non-commercial purposes.</p>

      <h2>5. Content Disclaimer</h2>
      <p>The App aggregates content from publicly available sources. We do not host or store video content on our servers. If you are a content owner and believe your rights are being infringed, please contact us for prompt removal.</p>

      <h2>6. Availability</h2>
      <p>We strive to keep the App available at all times but do not guarantee uninterrupted access. The App may be temporarily unavailable for maintenance or updates.</p>

      <h2>7. Limitation of Liability</h2>
      <p>The App is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.</p>

      <h2>8. Termination</h2>
      <p>We reserve the right to terminate or suspend access to the App at any time, without prior notice, for conduct that violates these Terms.</p>

      <h2>9. Changes to Terms</h2>
      <p>We may modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.</p>

      <h2>10. Contact Us</h2>
      <p>For questions regarding these Terms, contact us at <a href="mailto:support@pakistaniserials.app">support@pakistaniserials.app</a>.</p>
      `,
    );
  }
}

function page(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Pakistani Serials</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#111;color:#e0e0e0;line-height:1.7;padding:24px 16px 48px}
    .container{max-width:720px;margin:0 auto}
    h1{font-size:1.6rem;color:#D4AF37;margin-bottom:8px}
    .subtitle{color:#888;font-size:0.85rem;margin-bottom:32px}
    h2{font-size:1.1rem;color:#fff;margin:28px 0 8px;padding-top:16px;border-top:1px solid #222}
    p{margin-bottom:12px;color:#ccc}
    ul{margin:0 0 12px 20px}
    li{margin-bottom:6px;color:#ccc}
    a{color:#D4AF37;text-decoration:none}
    a:hover{text-decoration:underline}
    strong{color:#fff}
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p class="subtitle">Pakistani Serials</p>
    ${body}
  </div>
</body>
</html>`;
}
