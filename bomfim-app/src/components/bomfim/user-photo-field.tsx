import { useState } from "react";
import { Camera01, Trash01, Upload01 } from "@untitledui/icons";
import { AvatarProfilePhoto } from "@/components/base/avatar/avatar-profile-photo";
import { getInitialsFromWords } from "@/components/base/avatar/utils";
import { FileTrigger } from "@/components/base/file-upload-trigger/file-upload-trigger";
import { Button } from "@/components/base/buttons/button";
import { UserCameraCapture } from "@/components/bomfim/user-camera-capture";
import { resizeImageToDataUrl } from "@/utils/resize-image";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type UserPhotoFieldProps = {
    name: string;
    photo: string | null;
    onPhotoChange: (photo: string | null) => void;
    onError?: (message: string) => void;
};

async function handleFiles(files: FileList | null, onPhotoChange: (photo: string | null) => void, onError?: (message: string) => void) {
    const file = files?.[0];
    if (!file) return;
    try {
        onPhotoChange(await resizeImageToDataUrl(file));
    } catch (e) {
        onError?.(e instanceof Error ? e.message : "Não foi possível usar esta imagem.");
    }
}

export function UserPhotoField({ name, photo, onPhotoChange, onError }: UserPhotoFieldProps) {
    const [cameraOpen, setCameraOpen] = useState(false);
    const initials = getInitialsFromWords(name || "?");

    return (
        <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-secondary">Fotografia</span>
            <div className="flex flex-wrap items-center gap-4">
                <AvatarProfilePhoto size="sm" src={photo ?? undefined} initials={initials} alt={name || "Usuário"} />
                <div className="flex flex-wrap gap-2">
                    <FileTrigger acceptedFileTypes={IMAGE_TYPES} onSelect={(files) => void handleFiles(files, onPhotoChange, onError)}>
                        <Button type="button" size="sm" color="secondary" iconLeading={Upload01}>
                            Importar
                        </Button>
                    </FileTrigger>
                    <Button type="button" size="sm" color="secondary" iconLeading={Camera01} onClick={() => setCameraOpen(true)}>
                        Câmera
                    </Button>
                    {photo && (
                        <Button type="button" size="sm" color="tertiary" iconLeading={Trash01} onClick={() => onPhotoChange(null)}>
                            Remover
                        </Button>
                    )}
                </div>
            </div>
            <UserCameraCapture
                isOpen={cameraOpen}
                onOpenChange={setCameraOpen}
                onError={onError}
                onCapture={(file) => {
                    void (async () => {
                        try {
                            onPhotoChange(await resizeImageToDataUrl(file));
                        } catch (e) {
                            onError?.(e instanceof Error ? e.message : "Não foi possível usar esta imagem.");
                        }
                    })();
                }}
            />
        </div>
    );
}
