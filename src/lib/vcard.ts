export type ParsedVCard = {
  name: string;
  phone: string;
  whatsapp: boolean;
  whatsappBusiness: boolean;
  businessName: string;
  businessDescription: string;
  notes: string;
  source: "whatsapp_import";
};

function decodeValue(value: string) {
  return value
    .replace(/=0D=0A/gi, "\\n")
    .replace(/=0A/gi, "\\n")
    .replace(/=3D/gi, "=")
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function fieldValue(lines: string[], pattern: RegExp) {
  const line = lines.find((item) => pattern.test(item));
  if (!line) return "";
  return decodeValue(line.slice(line.indexOf(":") + 1));
}

function normalizePhone(value: string) {
  let phone = value.trim().replace(/[^\d+]/g, "");
  if (phone.startsWith("267") && !phone.startsWith("+")) phone = "+" + phone;
  if (/^7\d{7}$/.test(phone)) phone = "+267" + phone;
  return /^\+267\d{8}$/.test(phone) ? phone : "";
}

export function parseWhatsAppVCard(raw: string) {
  const unfolded = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .reduce<string[]>((lines, line) => {
      if (/^[ \t]/.test(line) && lines.length) {
        lines[lines.length - 1] += line.slice(1);
      } else {
        lines.push(line);
      }
      return lines;
    }, [])
    .join("\n");

  const cards = unfolded
    .split(/BEGIN:VCARD/i)
    .slice(1)
    .map((card) => card.split(/END:VCARD/i)[0]);

  const byPhone = new Map<string, ParsedVCard>();

  for (const card of cards) {
    const lines = card.split("\n");
    const name = fieldValue(lines, /^FN(?:;[^:]*)?:/i) || fieldValue(lines, /^N(?:;[^:]*)?:/i);
    const phoneLines = lines.filter((line) => /^(?:TEL|ITEM\d+\.TEL)(?:;[^:]*)?:/i.test(line));
    const phones = phoneLines
      .map((line) => normalizePhone(line.slice(line.indexOf(":") + 1)))
      .filter(Boolean);

    if (!phones.length) continue;

    const businessName = fieldValue(lines, /^X-WA-BIZ-NAME:/i);
    const businessDescription = fieldValue(lines, /^X-WA-BIZ-DESCRIPTION:/i);

    for (const phone of phones) {
      const previous = byPhone.get(phone);
      byPhone.set(phone, {
        name: name || previous?.name || "Unknown contact",
        phone,
        whatsapp: true,
        whatsappBusiness: Boolean(businessName || businessDescription) || Boolean(previous?.whatsappBusiness),
        businessName: businessName || previous?.businessName || "",
        businessDescription: businessDescription || previous?.businessDescription || "",
        notes: previous?.notes || "",
        source: "whatsapp_import",
      });
    }
  }

  return [...byPhone.values()];
}
