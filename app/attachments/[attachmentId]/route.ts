import { NextResponse, type NextRequest } from "next/server";
import {
  createAttachmentSignedUrl,
  getAttachment,
} from "@/lib/data/attachments";
import { requireUser } from "@/lib/supabase/auth";

/**
 * Stable, auth-guarded href for an attachment. The bucket is private, so this
 * mints a short-lived signed URL and redirects to it. Used both for opening a
 * file and as the `src` for image thumbnails.
 *
 * `?download=1` returns it as an attachment download instead of inline.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { supabase, user } = await requireUser();
  const { attachmentId } = await params;

  try {
    const attachment = await getAttachment(supabase, user.id, attachmentId);
    const signedUrl = await createAttachmentSignedUrl(supabase, attachment, {
      download: request.nextUrl.searchParams.has("download"),
    });

    return NextResponse.redirect(signedUrl);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
