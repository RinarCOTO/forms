type RenderImageOptions = {
  width?: number;
  quality?: number;
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function isImagePath(pathname: string) {
  const lowerPath = pathname.toLowerCase();
  return IMAGE_EXTENSIONS.some((extension) => lowerPath.includes(extension));
}

export function toRenderedImageUrl(
  signedUrl: string,
  { width = 480, quality = 40 }: RenderImageOptions = {}
): string {
  try {
    const url = new URL(signedUrl);
    if (!url.pathname.includes("/storage/v1/object/sign/") || !isImagePath(url.pathname)) {
      return signedUrl;
    }

    url.pathname = url.pathname.replace(
      "/storage/v1/object/sign/",
      "/storage/v1/render/image/sign/"
    );
    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", String(quality));
    return url.toString();
  } catch {
    return signedUrl;
  }
}

export function toPrintImageUrl(signedUrl: string): string {
  return toRenderedImageUrl(signedUrl, { width: 2200, quality: 82 });
}

export function toPreviewImageUrl(signedUrl: string): string {
  return toRenderedImageUrl(signedUrl, { width: 480, quality: 40 });
}
