import { Media, VideoType } from "./media";
import { PLACE_HOLDER, PROJECT_ID } from "./settings";

export const VERSION = "1";
export const BUCKET = `https://${PROJECT_ID}.appspot.com.storage.googleapis.com/`;
export const DOWNLOAD_URL = `https://storage.googleapis.com/download/storage/v1/b/${PROJECT_ID}.appspot.com/o/`;
export const ONE_HOUR = 3600000; // 1000 * 60 * 60
export const ONE_DAY = ONE_HOUR * 24;
export const MAX_TIME = 32503708800000; // 1/1/3000 backward
export const MIN_TIME = 1612166400000; // 2/1/2021
const PADDING = 14; /* "32503708800000".length */
export const MAX_IMAGE_SIZE = 2048;
export const THUMBNAIL_SIZE = 340;
export const SIZES = `${THUMBNAIL_SIZE}x${THUMBNAIL_SIZE}`;
export const SENDER_ID_TOPFAN = "topfan";

export function toHandle(text: string) {
  return normalize(text)
    .replace(/[^0-9a-zA-Z_\-’\s]/g, "")
    .trim()
    .replace(/[\s’]+/g, "-");
}

export function toSlug(text: string) {
  return normalize(text)
    .replace(/[^0-9a-zA-Z_\-’\s]/g, "")
    .trim()
    .replace(/[\s’]+/g, "");
}

export function normalize(text: string) {
  return text
    ? text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]|&|%/g, "")
        .replace(/đ/g, "d")
    : text;
}

/**
 * max radix 36 to shortest length
 * @param radix
 * @param seed
 */
export function generateId(radix: number = 36, seed?: number) {
  const padding = radix === 36 ? 9 : MAX_TIME.toString(radix).length;
  return pad((seed || Date.now()).toString(radix), padding) + random1(radix);
}

export function generateHash(input: string) {
  const p = 31;
  const m = parseInt("zzzzzzzzzz", 36);
  let hash_value = 0;
  let p_pow = 1;
  const a = "0".charCodeAt(0);
  Array.from(input).forEach((c) => {
    hash_value = (hash_value + (c.charCodeAt(0) - a + 1) * p_pow) % m;
    p_pow = (p_pow * p) % m;
  });
  return pad(hash_value.toString(36), 10);
}

export function generateDecreasingId(radix?: number) {
  return generateId(radix, MAX_TIME - Date.now());
}

export function originalTime(decreasingId: string, radix: number = 36) {
  const padding = radix === 10 ? 14 : MAX_TIME.toString(radix).length;
  return new Date(
    MAX_TIME - parseInt(decreasingId.substring(0, padding), radix)
  );
}

/**
 * Use iso string to store date: readable, sortable, quickly parsable
 */
export function timeStamp() {
  return new Date().toISOString();
}

export function random1(radix: number = 10) {
  return Math.floor(Math.random() * radix).toString(radix);
}

/**
 * sort transactions newest first
 * anchor if want to have a stable id
 */
export function getTransactionId(anchor?: number | string) {
  return pad(MAX_TIME - Number(anchor || Date.now()), PADDING);
}

export function pad(n: number | string, width: number) {
  const s = String(n);
  return s.length >= width ? s : new Array(width - s.length + 1).join("0") + s;
}

/**
 * get storage prefix
 * @param url
 */
export function getPrefix(url: string) {
  const start = `https://${PROJECT_ID}.appspot.com.storage.googleapis.com/`
    .length;
  const i = url.indexOf("?", start);
  return i > 0 ? url.substring(start, i) : url.substring(start);
}

const encoded = [1, 7, 4, 8, 6, 2, 5, 0, 3, 9];

export function generateOrderNumber() {
  let number = Date.now() - MIN_TIME;
  let power = 1;
  let orderNumber = 0;
  while (number > 0) {
    orderNumber = orderNumber + encoded[number % 10] * power;
    number = Math.floor(number / 10);
    power *= 10;
  }
  return (Math.floor(Math.random() * 9) + 1) * power + orderNumber;
}

export function getSource(path: string) {
  return encodeURI(BUCKET + path);
}

export function getProductImage(
  product: { sid: string; folder?: string },
  mediaId: string
) {
  const { sid, folder } = product;
  const subFolder = folder ? `${folder}/` : "";
  return `products/${sid}/${subFolder}${mediaId}`;
}

export function getBucketURL(path: string) {
  return BUCKET + path;
}

export function getDownloadUrl(path: string) {
  return DOWNLOAD_URL + encodeURIComponent(path) + "?alt=media";
}

export function getOriginal(media: Media) {
  return media ? getBucketURL(media.path) : PLACE_HOLDER;
}

export function get480VideoPath(path: string) {
  return changeFileNamePostfix(path, `_480.mp4`);
}

export function get360VideoPath(path: string) {
  return changeFileNamePostfix(path, `_360.mp4`);
}

export function getThumbnail(media: Media, placeholder: string = PLACE_HOLDER) {
  if (media?.path) {
    return getBucketURL(getThumbnailPath(media.path));
  } else {
    return placeholder;
  }
}

export function getThumbnailPath(path: string) {
  return changeFileNamePostfix(path, `_${SIZES}.webp`);
}

export function changeFileNamePostfix(
  path: string,
  postfix: string,
  removeQuery = false
) {
  const i = path.lastIndexOf(".");
  const j = path.indexOf("?", i);
  const query = j > -1 ? path.substring(j) : "";
  const filename = i > -1 ? path.substring(0, i) : path;
  return `${filename}${postfix}${removeQuery ? "" : query}`;
}

export function getPoster(
  video: VideoType,
  placeHolder: string = PLACE_HOLDER
) {
  if (video?.path) {
    return getBucketURL(changeFileNamePostfix(video.path, ".jpg"));
  } else {
    return placeHolder;
  }
}

export function idolVideoPath(uid: string, filename: string = "idol") {
  return `profiles/${uid}/video/${filename}`;
}

export function productVideoPath(uid: string) {
  return `products/${uid}/video/idol_topfan.mp4`;
}

export function productPath(slug: String) {
  return `idols/${slug}`;
}

export function originalVideoURL(id: string, video: VideoType) {
  const path = `responses/${id}`;
  return getBucketURL(video.path || path);
}

export function bookingVideoPath(id: String) {
  return `responses/${id}_topfan.mp4`;
}

export function profilePhotoPath(uid: string, filename: string = "0") {
  return `profiles/${uid}/photo/${filename}`;
}

export function profileEventPath(uid: string, filename: string = "0") {
  return `profiles/${uid}/event/${filename}`;
}

export function toMediaId(path: string) {
  const i = path.lastIndexOf(".");
  const filePath = i > -1 ? path.substring(0, i) : path;

  const result = filePath
    .replace(/\/|\_\d+$|\_\d+\x\d+$/g, "-")
    .replace(/^\-+|\-+$/g, "");
  return result.endsWith("_topfan") ? result.slice(0, -7) : result;
}
