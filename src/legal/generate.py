#!/usr/bin/env python3
"""Generates the 12 legal pages under src/legal/<slug>/index.html.
Run once to produce content; safe to re-run (overwrites)."""
import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
LAST_UPDATED = "23 July 2026"

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>{title} — FM Finance Suite</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
:root{{--n:#060e1e;--n2:#0a1628;--n3:#0f1f3d;--t:#00c9a7;--tx:#e8edf5;--tx2:#8fa3bf;--tx3:#4a6080;--b:rgba(255,255,255,.08);--am:#f5a623;--mo:'IBM Plex Mono',monospace;--sa:'DM Sans',sans-serif;--di:'Syne',sans-serif}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:var(--n);color:var(--tx);font-family:var(--sa);line-height:1.7;min-height:100vh;display:flex;flex-direction:column}}
header{{padding:1.1rem 1.6rem;border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.6rem}}
.brand{{font-family:var(--di);font-weight:800;font-size:1.05rem;color:var(--tx);text-decoration:none}}
.brand span{{color:var(--t)}}
header a.back{{color:var(--tx2);text-decoration:none;font-size:.85rem;font-family:var(--mo)}}
header a.back:hover{{color:var(--t)}}
main{{max-width:760px;margin:0 auto;padding:2.6rem 1.6rem 4rem;flex:1;width:100%}}
h1{{font-family:var(--di);font-size:1.9rem;font-weight:800;margin-bottom:.35rem}}
.meta{{color:var(--tx3);font-family:var(--mo);font-size:.78rem;margin-bottom:2rem}}
.notice{{background:rgba(245,166,35,.08);border:1px solid rgba(245,166,35,.3);border-radius:8px;padding:.9rem 1.1rem;font-size:.85rem;color:var(--tx2);margin-bottom:2rem}}
.notice b{{color:var(--am)}}
h2{{font-family:var(--di);font-size:1.15rem;font-weight:700;margin:1.8rem 0 .6rem;color:var(--tx)}}
p{{color:var(--tx2);font-size:.94rem;margin-bottom:.8rem}}
ul{{color:var(--tx2);font-size:.94rem;margin:0 0 .8rem 1.3rem}}
li{{margin-bottom:.35rem}}
a{{color:var(--t)}}
footer{{border-top:1px solid var(--b);padding:1.4rem 1.6rem;text-align:center}}
footer nav{{display:flex;flex-wrap:wrap;gap:.9rem;justify-content:center;margin-bottom:.6rem}}
footer nav a{{color:var(--tx3);text-decoration:none;font-size:.78rem;font-family:var(--mo)}}
footer nav a:hover{{color:var(--t)}}
footer small{{color:var(--tx3);font-size:.75rem}}
</style>
</head>
<body>
<header>
<a class="brand" href="/home/">FM<span> Finance Suite</span></a>
<a class="back" href="/home/">&larr; Back to site</a>
</header>
<main>
<h1>{title}</h1>
<div class="meta">Last updated: {last_updated}</div>
<div class="notice"><b>Not legal advice.</b> This document is a plain-language template describing how this practice area is generally handled. It has not been reviewed by a licensed Nigerian lawyer and should be reviewed by qualified counsel before being relied on as a binding legal document.</div>
{content}
</main>
<footer>
<nav>
<a href="../terms/">Terms</a>
<a href="../privacy/">Privacy</a>
<a href="../cookies/">Cookies</a>
<a href="../disclaimer/">Disclaimer</a>
<a href="../acceptable-use/">Acceptable Use</a>
<a href="../ai-consent/">AI Consent</a>
<a href="../dpa/">DPA</a>
<a href="../data-processing-notice/">Data Processing Notice</a>
<a href="../subscription-terms/">Subscription Terms</a>
<a href="../consent-release/">Consent &amp; Release</a>
<a href="../privacy-preferences/">Privacy Preferences</a>
</nav>
<small>&copy; 2026 FM Finance Suite. All rights reserved.</small>
</footer>
</body>
</html>
"""

def sec(heading, *paragraphs_or_lists):
    out = f"<h2>{heading}</h2>\n"
    for p in paragraphs_or_lists:
        if isinstance(p, list):
            out += "<ul>" + "".join(f"<li>{li}</li>" for li in p) + "</ul>\n"
        else:
            out += f"<p>{p}</p>\n"
    return out

PAGES = {}

# ---------------------------------------------------------------- terms
PAGES["terms"] = ("Terms of Service", "".join([
    sec("1. Who this applies to",
        "These Terms govern your use of the FM Finance Suite platform, including its Treasury Intelligence, Receivables Tracker, and Reconciliation modules, the CapMax investment workspace, the GMI market-information page, the Job module, and the Portal account system (together, the &ldquo;Services&rdquo;)."),
    sec("2. Accounts",
        "You must provide accurate information when creating an Individual or Corporate account and are responsible for activity that happens under your login. Corporate account administrators are responsible for the users they invite into their organisation."),
    sec("3. Nature of the Services",
        "The Services are software tools for financial analysis, reporting, and record-keeping. They are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. You remain responsible for verifying any figure, calculation, or recommendation before relying on it for a real financial, tax, or investment decision — see the <a href=\"../disclaimer/\">Disclaimer</a> for detail."),
    sec("4. Acceptable use",
        "Use of the Services is subject to the <a href=\"../acceptable-use/\">Acceptable Use Policy</a>, which is incorporated into these Terms by reference."),
    sec("5. Your data",
        "How your data is collected, used, and protected is described in the <a href=\"../privacy/\">Privacy Policy</a> and, where applicable, the <a href=\"../dpa/\">Data Processing Agreement</a>."),
    sec("6. Fees",
        "If any part of the Services is offered on a paid or subscription basis, those charges are governed by the <a href=\"../subscription-terms/\">Subscription Terms</a>."),
    sec("7. Intellectual property",
        "The Services, including their design, code, and generated report templates, are the property of FM Finance Suite / Felix Happy Michael, except for content you upload or input, which remains yours."),
    sec("8. Termination",
        "Access may be suspended or terminated for breach of these Terms, non-payment of applicable fees, or extended inactivity. You may stop using the Services and request account deletion at any time."),
    sec("9. Limitation of liability",
        "To the maximum extent permitted by Nigerian law, FM Finance Suite is not liable for indirect, incidental, or consequential losses arising from use of the Services, including losses arising from financial or investment decisions made using outputs of the Services."),
    sec("10. Changes to these Terms",
        "Material changes will be flagged through the <a href=\"../re-accept/\">re-acceptance</a> flow the next time you sign in. Continuing to use the Services after re-accepting means you agree to the updated Terms."),
    sec("11. Governing law",
        "These Terms are governed by the laws of the Federal Republic of Nigeria, without prejudice to any mandatory consumer-protection or data-protection rights you may have."),
]))

# ------------------------------------------------------------- privacy
PAGES["privacy"] = ("Privacy Policy", "".join([
    sec("1. Who we are",
        "This Privacy Policy explains how FM Finance Suite (&ldquo;we&rdquo;) collects, uses, and protects personal data in connection with the Services, in line with the Nigeria Data Protection Act 2023 (NDPA) and guidance issued by the Nigeria Data Protection Commission (NDPC)."),
    sec("2. What we collect",
        ["Account data: name, email address, organisation name, and role.",
         "Financial data you input or upload: e.g. debtor ledgers, treasury positions, borrowing facilities, investment holdings.",
         "Usage data: pages visited, features used, device and browser type.",
         "Support data: anything you share with us when requesting help."]),
    sec("3. How we use it",
        ["To operate and improve the Services (generating dashboards, calculations, and reports).",
         "To authenticate you and manage Individual and Corporate accounts.",
         "To generate AI-assisted content or recommendations where you have opted in (see <a href=\"../ai-consent/\">AI Consent</a>).",
         "To communicate with you about your account or material changes to these policies.",
         "To meet legal, regulatory, and audit obligations."]),
    sec("4. Legal basis for processing",
        "Depending on the data and context, we rely on your consent, the performance of a contract with you, or our legitimate interest in operating and securing the Services, consistent with the lawful bases recognised under the NDPA."),
    sec("5. Sharing",
        "We do not sell personal data. Data may be shared with infrastructure providers strictly necessary to run the Services (e.g. hosting and database providers), or where required by law or valid regulatory request."),
    sec("6. AI processing",
        "Certain features (e.g. CapMax's recommendation engine, and content-generation tools) send relevant, minimised data to a third-party AI provider (Anthropic) to generate output. See <a href=\"../ai-consent/\">AI Consent</a> for what is and is not sent."),
    sec("7. Retention",
        "We retain account and financial data for as long as your account is active, plus a limited period afterward for legal, audit, and backup purposes, after which it is deleted or anonymised."),
    sec("8. Your rights",
        "Under the NDPA you may request access to, correction of, or deletion of your personal data, and may object to certain processing. You can manage some of these directly from <a href=\"../privacy-preferences/\">Privacy Preferences</a>, or contact us for anything else."),
    sec("9. Security",
        "We apply reasonable technical and organisational measures (access controls, encryption in transit, scoped storage) to protect your data, but no system is 100% secure and you should also take care to protect your own login credentials."),
    sec("10. International transfers",
        "Where data is processed outside Nigeria (for example, by cloud or AI infrastructure providers), we take steps consistent with NDPA cross-border transfer requirements."),
    sec("11. Contact",
        "For privacy questions or to exercise your rights, contact the account holder listed on your Portal organisation, or the site administrator."),
]))

# -------------------------------------------------------------- cookies
PAGES["cookies"] = ("Cookie Policy", "".join([
    sec("1. What cookies we use",
        "The Services primarily use local browser storage (not third-party tracking cookies) to keep you signed in, remember your theme preference (dark/light), and cache dashboard state between visits."),
    sec("2. Categories",
        ["<b>Strictly necessary</b> — session/auth tokens required to keep you logged in. Cannot be disabled without losing the ability to sign in.",
         "<b>Preference</b> — remembers your light/dark theme choice and similar display settings.",
         "<b>Analytics</b> — if enabled, helps us understand which features are used most. Currently minimal to none."]),
    sec("3. Managing preferences",
        "You can review and adjust what's stored via <a href=\"../privacy-preferences/\">Privacy Preferences</a>, or clear your browser's local storage/cookies for this site directly through your browser settings."),
    sec("4. Third-party content",
        "Some pages load fonts and libraries (e.g. Google Fonts, chart/reporting libraries) from third-party CDNs, which may set their own minimal technical cookies under their respective policies."),
]))

# ----------------------------------------------------------- disclaimer
PAGES["disclaimer"] = ("Disclaimer", "".join([
    sec("1. Not financial, tax, or legal advice",
        "Nothing produced by FM Finance Suite, CapMax, Treasury Intelligence, or the Receivables Tracker — including dashboards, ratios, AI-generated recommendations, PowerPoint board reports, or PDF exports — constitutes financial, investment, tax, or legal advice. It is a decision-support tool, not a substitute for professional advice."),
    sec("2. Simulated and illustrative data",
        "Certain views (for example, CapMax's NGX watchlists and market data) may use simulated or illustrative data for demonstration purposes and should not be relied on for real trading or investment decisions unless a page explicitly states the data is live and sourced from a named provider."),
    sec("3. AI-generated content",
        "Content or recommendations produced with AI assistance may be inaccurate, incomplete, or out of date, and should be independently verified before being acted on or presented as fact."),
    sec("4. No guarantee of accuracy",
        "While reasonable care is taken in building calculations (e.g. WACC, WACD, ECL staging, debtor ageing), formulas, tax rules, and market conventions change, and you remain responsible for validating outputs against current regulation and your own professional judgment before relying on them."),
    sec("5. Investment risk",
        "All investments carry risk, including the risk of loss of capital. Past performance shown in any report is not indicative of future results."),
]))

# ------------------------------------------------------- acceptable-use
PAGES["acceptable-use"] = ("Acceptable Use Policy", "".join([
    sec("You agree not to:",
        ["Use the Services to store or process data you are not legally entitled to hold (e.g. another person's financial data without authorisation).",
         "Attempt to bypass authentication, rate limits, or access controls, or probe the platform for vulnerabilities without authorisation.",
         "Reverse-engineer, scrape, or resell the Services or their outputs as your own competing product.",
         "Upload malicious files or attempt to use the Services to distribute malware.",
         "Use AI-assisted features to generate unlawful, deceptive, or harassing content, or content that violates a third party's rights.",
         "Use a Corporate account to admit or retain members who are not genuinely part of your organisation."]),
    sec("Enforcement",
        "Violations may result in suspension or termination of your account, and may be reported to relevant authorities where required by law."),
]))

# ------------------------------------------------------------ ai-consent
PAGES["ai-consent"] = ("AI Consent &amp; Disclosure", "".join([
    sec("1. Where AI is used",
        ["CapMax's AI Recommendation Engine, which can suggest portfolio or rebalancing actions based on the data you provide.",
         "Content-generation tools (such as the Copy Desk module) that draft text based on prompts you supply.",
         "Any other feature explicitly labelled as AI-assisted within the Services."]),
    sec("2. What is sent",
        "Only the minimum data needed to generate the specific output you request is sent to the AI provider (Anthropic) — for example, portfolio composition for a rebalancing suggestion, or your topic/angle inputs for content generation. We do not knowingly send full account credentials or unrelated personal data."),
    sec("3. Your consent",
        "By using an AI-labelled feature, you consent to the relevant inputs being sent to the AI provider for the purpose of generating that output, in accordance with the <a href=\"../privacy/\">Privacy Policy</a>. You may choose not to use AI-labelled features at all."),
    sec("4. Limitations",
        "AI-generated output can be wrong, biased, or out of date. It is provided as a starting point, not a final answer — see the <a href=\"../disclaimer/\">Disclaimer</a>. You are responsible for reviewing AI-generated content before acting on it or sharing it externally (e.g. in a board report)."),
    sec("5. No training on your data by default",
        "Data sent for AI processing is used to generate your requested output and is not knowingly used by us to train our own models unless we tell you otherwise in a specific feature's description."),
]))

# ------------------------------------------------------------------ dpa
PAGES["dpa"] = ("Data Processing Agreement", "".join([
    sec("1. Purpose",
        "This DPA applies where an organisation (&ldquo;Customer&rdquo;) uses a Corporate account and, in doing so, acts as a Data Controller for personal data it inputs into the Services, with FM Finance Suite acting as Data Processor, consistent with the NDPA's controller/processor framework."),
    sec("2. Scope of processing",
        "FM Finance Suite processes personal data solely to provide the Services as configured by the Customer's account administrators (e.g. displaying debtor, treasury, or user data within the Customer's own workspace)."),
    sec("3. Processor obligations",
        ["Process personal data only on the Customer's documented instructions.",
         "Ensure personnel with access are bound by confidentiality obligations.",
         "Implement appropriate technical and organisational security measures.",
         "Assist the Customer in responding to data-subject requests and NDPC inquiries relating to the Customer's data.",
         "Notify the Customer without undue delay of any personal data breach affecting the Customer's data.",
         "Delete or return personal data at the end of the engagement, subject to any legal retention requirement."]),
    sec("4. Sub-processors",
        "The Customer authorises the use of the infrastructure and AI sub-processors described in the <a href=\"../privacy/\">Privacy Policy</a> and <a href=\"../ai-consent/\">AI Consent</a> notice, provided equivalent data-protection obligations are imposed on them."),
    sec("5. Precedence",
        "This DPA supplements, and does not replace, any separately negotiated written agreement between FM Finance Suite and a specific Corporate customer, which will take precedence in case of conflict."),
]))

# ------------------------------------------------------ data-processing-notice
PAGES["data-processing-notice"] = ("Data Processing Notice", "".join([
    sec("This notice summarises, in plain language, the core facts the NDPA requires us to make available to you as a data subject:", ),
    sec("Controller",
        "FM Finance Suite (operated by Felix Happy Michael) is the data controller for account-level and platform-usage data. Where you use a Corporate account, your employer/organisation may also act as a controller for the financial data it inputs — see the <a href=\"../dpa/\">DPA</a>."),
    sec("Purpose and lawful basis",
        "Data is processed to provide the Services you've signed up for, based on your consent and/or the contract formed by these Terms — see <a href=\"../privacy/\">Privacy Policy</a> section 4 for detail."),
    sec("Recipients",
        "Hosting/infrastructure providers, and (only for AI-labelled features) our AI provider — see <a href=\"../ai-consent/\">AI Consent</a>."),
    sec("Retention",
        "For as long as your account is active, plus a limited period for legal/audit purposes — see <a href=\"../privacy/\">Privacy Policy</a> section 7."),
    sec("Your rights",
        "Access, correction, deletion, and objection, exercisable via <a href=\"../privacy-preferences/\">Privacy Preferences</a> or by contacting us directly. You also have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC)."),
]))

# ------------------------------------------------------- subscription-terms
PAGES["subscription-terms"] = ("Subscription Terms", "".join([
    sec("Applicability",
        "This page applies only to features of the Services that are explicitly offered on a paid or subscription basis. If you are only using free/unpaid features, this page does not currently impose any obligation on you."),
    sec("Billing",
        "Where a paid plan is offered, pricing, billing frequency, and accepted payment methods will be clearly shown before you subscribe. Fees are exclusive of any applicable taxes unless stated otherwise."),
    sec("Cancellation",
        "You may cancel a paid plan at any time; access typically continues until the end of the period already paid for, unless stated otherwise for a specific plan."),
    sec("Refunds",
        "Refund eligibility, if any, will be stated at the point of purchase for the specific plan or report package involved."),
    sec("Changes",
        "Pricing or plan features may change with notice; continued use of a paid plan after a pricing change takes effect constitutes acceptance of the new pricing going forward."),
]))

# --------------------------------------------------------- consent-release
PAGES["consent-release"] = ("Consent &amp; Release", "".join([
    sec("By creating an account or using the Services, you acknowledge and agree that:",
        ["You have read and accept the <a href=\"../terms/\">Terms of Service</a>, <a href=\"../privacy/\">Privacy Policy</a>, and <a href=\"../acceptable-use/\">Acceptable Use Policy</a>.",
         "You understand outputs of the Services (dashboards, calculations, AI suggestions, and generated reports) are decision-support tools, not professional advice — see the <a href=\"../disclaimer/\">Disclaimer</a>.",
         "Where you use AI-assisted features, you consent to the data handling described in <a href=\"../ai-consent/\">AI Consent</a>.",
         "You release FM Finance Suite from liability for financial, investment, or business decisions you make based on your own independent judgment, even where informed by outputs of the Services, to the maximum extent permitted by Nigerian law."]),
    sec("Withdrawing consent",
        "You may withdraw consent for optional processing (such as AI-assisted features) at any time by ceasing to use those specific features, or by contacting us regarding broader account-level consent."),
]))

# ------------------------------------------------------- privacy-preferences
PAGES["privacy-preferences"] = ("Privacy Preferences", None)  # special: interactive page, built separately

# --------------------------------------------------------------- re-accept
PAGES["re-accept"] = ("Updated Terms — Please Re-Accept", None)  # special: interactive page, built separately

for slug, (title, content) in PAGES.items():
    if content is None:
        continue  # handled separately (interactive pages)
    out_dir = os.path.join(ROOT, slug)
    os.makedirs(out_dir, exist_ok=True)
    html = TEMPLATE.format(title=title, last_updated=LAST_UPDATED, content=content)
    with open(os.path.join(out_dir, "index.html"), "w") as f:
        f.write(html)
    print(f"wrote {slug}/index.html ({len(html)} bytes)")

print("\nDone. privacy-preferences/ and re-accept/ are built separately (interactive).")
