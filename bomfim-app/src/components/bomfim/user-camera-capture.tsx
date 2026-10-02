import { useEffect, useRef, useState } from "react";
import { Camera01 } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";

type UserCameraCaptureProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCapture: (file: File) => void;
    onError?: (message: string) => void;
};

export function UserCameraCapture({ isOpen, onOpenChange, onCapture, onError }: UserCameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setReady(false);
            return;
        }

        let cancelled = false;

        void (async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                onError?.("Câmera não disponível neste navegador.");
                onOpenChange(false);
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
                    audio: false,
                });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;
                const video = videoRef.current;
                if (video) {
                    video.srcObject = stream;
                    await video.play();
                    setReady(true);
                }
            } catch {
                onError?.("Não foi possível acessar a câmera. Verifique as permissões.");
                onOpenChange(false);
            }
        })();

        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        };
    }, [isOpen, onError, onOpenChange]);

    const capture = () => {
        const video = videoRef.current;
        if (!video || !ready) return;
        const side = Math.min(video.videoWidth, video.videoHeight);
        const sx = (video.videoWidth - side) / 2;
        const sy = (video.videoHeight - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = side;
        canvas.height = side;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            onError?.("Não foi possível capturar a foto.");
            return;
        }
        ctx.drawImage(video, sx, sy, side, side, 0, 0, side, side);
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    onError?.("Não foi possível capturar a foto.");
                    return;
                }
                onCapture(new File([blob], "camera.jpg", { type: "image/jpeg" }));
                onOpenChange(false);
            },
            "image/jpeg",
            0.92,
        );
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
            <Modal className="max-w-md">
                <Dialog className="p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-primary">Tirar foto</h3>
                    <p className="mt-1 text-sm text-tertiary">Posicione o rosto no centro e capture.</p>
                    <div className="mt-4 overflow-hidden rounded-xl bg-secondary">
                        <video ref={videoRef} className="aspect-square w-full object-cover" playsInline muted aria-label="Pré-visualização da câmera" />
                    </div>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <Button type="button" color="secondary" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="button" iconLeading={Camera01} isDisabled={!ready} onClick={capture}>
                            Capturar
                        </Button>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
