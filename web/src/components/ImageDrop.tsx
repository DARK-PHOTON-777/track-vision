import React, { useRef, useState, DragEvent } from "react";
import { Spinner } from "./Spinner";

interface Props {
	modelReady: boolean;
	blobURL: string | null;
	classifying: boolean;
	onFile: (f: File) => void;
	onReset: () => void;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageDrop({ modelReady, blobURL, classifying, onFile, onReset }: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [drag, setDrag] = useState(false);

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		setDrag(false);
		const file = e.dataTransfer.files[0];
		if (file && ACCEPTED.includes(file.type)) onFile(file);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) onFile(file);
		e.target.value = '';
	};

	const busy = !modelReady || classifying;

	const borderClass = drag
		? 'border-red-500 bg-red-500/10'
		: blobURL
			? 'border-white/10'
			: 'border-dashed border-white/15 hover:border-red-500/50 hover:bg-white/[0.02]';

	return (
		<div className="flex flex-col gap-2">
			<div
				role="button"
				tabIndex={0}
				aria-label="Upload or take a photo of a rollercoaster"
				onClick={() => !busy && inputRef.current?.click()}
				onKeyDown={(e) => e.key === 'Enter' && !busy && inputRef.current?.click()}
				onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
				onDragLeave={() => setDrag(false)}
				onDrop={handleDrop}
				className={`
          relative w-full aspect-video rounded-2xl border overflow-hidden
          flex items-center justify-center
          transition-all duration-200 outline-none
          focus-visible:ring-2 focus-visible:ring-red-500
          ${busy ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${borderClass}
        `}
			>
				{/* Image preview */}
				{blobURL && (
					<img
						src={blobURL}
						alt="Selected track"
						className="absolute inset-0 w-full h-full object-cover"
					/>
				)}

				{/* Overlay when classifying */}
				{classifying && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 z-10">
						<Spinner size="lg" />
						<span className="font-display font-bold text-md uppercase text-white/50">
							Analyzing…
						</span>
					</div>
				)}

				{/* Model loading overlay */}
				{!modelReady && !classifying && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 z-10">
						<Spinner size="lg" />
						<span className="font-display font-bold text-md uppercase text-white/60">
							Loading model…
						</span>
					</div>
				)}

				{/* Empty state prompt */}
				{!blobURL && modelReady && !classifying && (
					<div className="flex flex-col items-center gap-2 px-6 text-center">
						<svg className="w-8 h-8 text-red-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="17 8 12 3 7 8" />
							<line x1="12" y1="3" x2="12" y2="15" />
						</svg>
						<span className="font-display font-bold text-lg tracking-widest uppercase text-white/70">
							Upload or take a photo
						</span>
						<span className="text-md text-white/25">
							Drag &amp; drop · tap · or use samples below
						</span>
					</div>
				)}
			</div>

			{/* Reset */}
			{blobURL && !classifying && (
				<button
					onClick={onReset}
					className="self-end font-display text-md font-bold uppercase text-white/50 hover:text-red-500 transition-colors px-1 py-0.5"
				>
					↺ Scan another
				</button>
			)}

			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				onChange={handleChange}
				className="hidden"
			/>
		</div>
	);
}