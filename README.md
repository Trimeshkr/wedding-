# Wedding Invitation — Static Preview

The original invitation is preserved in `myinvitations.io/invitation/shubh-aarambh/`.

## Preview
Enable GitHub Pages:
- Settings → Pages
- Source: Deploy from a branch
- Branch: `static-preview-fixes` (for review) or `main` (after merging)
- Folder: `/`

The root page redirects to the invitation.

## RSVP
The RSVP form is adapted for static hosting and opens WhatsApp with the guest response. On first use, the guest enters the host WhatsApp number with country code (digits only, e.g. 919876543210). It is saved in that browser/device. No WordPress backend is needed for this flow.

## Limitations
The page still references media and theme/plugin scripts from the original `myinvitations.io` domain; assets are not yet self-hosted. Features requiring WordPress AJAX, login, WooCommerce, and other server endpoints remain unavailable.
