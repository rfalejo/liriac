import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChapterBlock, ParagraphSuggestionState } from "../../types";
import { useParagraphSuggestionRequest } from "../useParagraphSuggestionRequest";
import { useParagraphSuggestionPromptRequest } from "../useParagraphSuggestionPromptRequest";

type ParagraphBlock = ChapterBlock & { type: "paragraph" };

type SuggestionResult = {
	instructions: string;
	text: string;
	isApplied: boolean;
};

type CopyState = "idle" | "pending" | "copied";

type ParagraphSuggestionControllerParams = {
	block: ParagraphBlock | null;
	isActive: boolean;
	draftText: string;
	onChangeDraft: (value: string) => void;
	chapterId: string | null;
	notifyUpdateFailure: (error: unknown) => void;
};

export function useParagraphSuggestionController({
	block,
	isActive,
	draftText,
	onChangeDraft,
	chapterId,
	notifyUpdateFailure,
}: ParagraphSuggestionControllerParams) {
	const { requestSuggestion, isPending } = useParagraphSuggestionRequest({
		chapterId,
	});
	const { requestPrompt } = useParagraphSuggestionPromptRequest({
		chapterId,
	});

	const [promptOpen, setPromptOpen] = useState(false);
	const [usesDraftAsPrompt, setUsesDraftAsPrompt] = useState(false);
	const [instructions, setInstructions] = useState("");
	const [result, setResult] = useState<SuggestionResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [draftSnapshot, setDraftSnapshot] = useState<string | null>(null);
	const [copyState, setCopyState] = useState<CopyState>("idle");

	const openPrompt = useCallback(() => {
		if (!block || !isActive) {
			return;
		}

		const trimmedDraft = draftText.trim();
		const shouldUseDraftAsPrompt = trimmedDraft.length === 0;

		setUsesDraftAsPrompt(shouldUseDraftAsPrompt);
		setPromptOpen(true);
		setError(null);
		setCopyState("idle");

		if (shouldUseDraftAsPrompt) {
			setInstructions(draftText);
		}
	}, [block, draftText, isActive]);

	const closePrompt = useCallback(() => {
		if (isPending || copyState === "pending") {
			return;
		}

		setPromptOpen(false);
		setUsesDraftAsPrompt(false);
		setInstructions("");
		setError(null);
		setDraftSnapshot(null);
		setCopyState("idle");
	}, [copyState, isPending]);

	const handleSubmit = useCallback(async () => {
		if (!block || !isActive) {
			return;
		}

		const currentInstructions = usesDraftAsPrompt ? draftText : instructions;
		const trimmed = currentInstructions.trim();

		if (!trimmed) {
			setError("Añade instrucciones para generar la sugerencia.");
			return;
		}

		setDraftSnapshot(draftText);

		try {
			const response = await requestSuggestion({
				blockId: block.id,
				instructions: trimmed,
			});

			setResult({
				instructions: trimmed,
				text: response.paragraphSuggestion,
				isApplied: false,
			});
			setPromptOpen(false);
			setInstructions(trimmed);
			setError(null);
			setUsesDraftAsPrompt(false);
			setCopyState("idle");
		} catch (suggestionError) {
			setError("No pudimos generar la sugerencia. Inténtalo de nuevo.");
			notifyUpdateFailure(suggestionError);
			setDraftSnapshot(null);
		}
	}, [
		block,
		draftText,
		instructions,
		isActive,
		notifyUpdateFailure,
		requestSuggestion,
		usesDraftAsPrompt,
	]);

	const handleDismissResult = useCallback(() => {
		const wasApplied = result?.isApplied ?? false;

		setResult(null);
		setError(null);
		setUsesDraftAsPrompt(false);
		setCopyState("idle");

		if (wasApplied && draftSnapshot !== null) {
			onChangeDraft(draftSnapshot);
		}

		setDraftSnapshot(null);
	}, [draftSnapshot, onChangeDraft, result]);

	const handleApplyResult = useCallback(() => {
		if (!result) {
			return;
		}

		onChangeDraft(result.text);
		setResult({
			instructions: result.instructions,
			text: result.text,
			isApplied: true,
		});
		setError(null);
		setUsesDraftAsPrompt(false);
		setCopyState("idle");
	}, [onChangeDraft, result]);

	const handleCopyPrompt = useCallback(async () => {
		if (!block || !isActive || copyState === "pending") {
			return;
		}

		const currentInstructions = usesDraftAsPrompt ? draftText : instructions;
		const trimmed = currentInstructions.trim();
		if (!trimmed) {
			return;
		}

		setCopyState("pending");
		try {
			const { prompt } = await requestPrompt({
				blockId: block.id,
				instructions: trimmed,
			});
			if (!prompt) {
				throw new Error("Empty prompt response");
			}

			if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
				throw new Error("Clipboard API unavailable");
			}

			await navigator.clipboard.writeText(prompt);

			setCopyState("copied");
			setError(null);
		} catch (copyError) {
			setCopyState("idle");
			setError("No pudimos copiar el prompt. Inténtalo de nuevo.");
			notifyUpdateFailure(copyError);
		}
	}, [
		block,
		copyState,
		draftText,
		instructions,
		isActive,
		notifyUpdateFailure,
		requestPrompt,
		usesDraftAsPrompt,
	]);

	useEffect(() => {
		if (usesDraftAsPrompt) {
			setInstructions(draftText);
		}
	}, [draftText, usesDraftAsPrompt]);

	useEffect(() => {
		if (!block) {
			setPromptOpen(false);
			setUsesDraftAsPrompt(false);
			setInstructions("");
			setResult(null);
			setError(null);
			setDraftSnapshot(null);
			setCopyState("idle");
			return;
		}

		setInstructions("");
		setError(null);
		setDraftSnapshot(null);
		setUsesDraftAsPrompt(false);
		setCopyState("idle");
	}, [block?.id]);

	useEffect(() => {
		if (!isActive) {
			setPromptOpen(false);
			setUsesDraftAsPrompt(false);
			setCopyState("idle");
		}
	}, [isActive]);

	useEffect(() => {
		setCopyState("idle");
	}, [instructions, promptOpen]);

	const suggestionState: ParagraphSuggestionState = useMemo(
		() => ({
			promptOpen,
			instructions,
			onChangeInstructions: setInstructions,
			onSubmit: handleSubmit,
			onClosePrompt: closePrompt,
			isRequesting: isPending,
			isCopyingPrompt: copyState === "pending",
			error,
			result: result
				? {
						instructions: result.instructions,
						text: result.text,
						isApplied: result.isApplied,
						onApply: handleApplyResult,
						onDismiss: handleDismissResult,
					}
				: null,
			usesDraftAsPrompt,
			onCopyPrompt: handleCopyPrompt,
			copyStatus: copyState === "copied" ? "copied" : "idle",
		}),
		[
			copyState,
			closePrompt,
			error,
			handleApplyResult,
			handleDismissResult,
			handleCopyPrompt,
			handleSubmit,
			instructions,
			isPending,
			promptOpen,
			result,
			usesDraftAsPrompt,
		],
	);

	return {
		suggestionState,
		openPrompt,
		closePrompt,
		isPending,
	};
}

