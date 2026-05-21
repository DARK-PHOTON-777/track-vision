export const Spinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
	const s =
		size === "sm"
			? "w-4 h-4 border-2"
			: size === "lg"
				? "w-16 h-16 border-4"
				: "w-8 h-8 border-4";
	return (
		<span
			className={`${s} rounded-full border-white/10 border-t-red-500 animate-spin block`}
			aria-label="Loading"
			role="status"
		/>
	);
};