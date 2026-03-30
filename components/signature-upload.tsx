// PAUSED — Digital signature module. Do not use or import until the auth
// question is resolved. See project memory: project_digital_signatures.md
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2, Loader2 } from "lucide-react";

export function SignatureUpload() {
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/user/signature')
      .then(r => r.json())
      .then(d => { if (d.data?.signedUrl) setSignatureUrl(d.data.signedUrl); })
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('File must be PNG, JPEG, or WebP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File must be under 2 MB');
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append('signature', file);
    try {
      const res = await fetch('/api/auth/user/signature', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Upload failed'); return; }
      // Refresh the signed URL
      const urlRes = await fetch('/api/auth/user/signature');
      const urlData = await urlRes.json();
      setSignatureUrl(urlData.data?.signedUrl ?? null);
      toast.success('Signature uploaded successfully');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch('/api/auth/user/signature', { method: 'DELETE' });
      if (!res.ok) { toast.error('Failed to remove signature'); return; }
      setSignatureUrl(null);
      toast.success('Signature removed');
    } catch {
      toast.error('Failed to remove signature');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) return <div className="h-24 flex items-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {signatureUrl ? (
        <div className="flex flex-col gap-3">
          <div className="border rounded-md p-3 bg-white w-fit">
            <Image src={signatureUrl} alt="Your signature" width={240} height={80} className="object-contain max-h-20" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-1" /> Replace
            </Button>
            <Button variant="outline" size="sm" onClick={handleRemove} disabled={removing} className="text-destructive hover:text-destructive">
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="border border-dashed rounded-md p-6 text-center text-muted-foreground text-sm">
            No signature uploaded yet
          </div>
          <Button variant="outline" size="sm" className="w-fit" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            Upload Signature
          </Button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
      <p className="text-xs text-muted-foreground">PNG, JPEG, or WebP · max 2 MB · will appear on signed FAAS forms</p>
    </div>
  );
}
