export function toInternationalPhone(phone: string) {
  if (phone) {
    const fixed = phone.replace(/\s/g, "");
    if (fixed.startsWith("+84")) {
      return fixed.charAt(3) === "0" ? "+84" + fixed.substr(4) : fixed;
    }
    return "+84" + remove0(fixed);
  }
  return "";
}

function remove0(phone: string) {
  return phone.charAt(0) === "0" ? phone.substr(1) : phone;
}

export function toLocalPhone(phone: string) {
  return phone.startsWith("+84") ? phone.substr(3) : phone;
}
