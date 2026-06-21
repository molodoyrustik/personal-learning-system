"use client";

import IconButton from "@mui/material/IconButton";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

type Props = {
  text: string;
  lang: string;
  size?: "small" | "medium";
};

export function PronounceButton({ text, size = "small" }: Props) {
  function handleClick() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  return (
    <IconButton onClick={handleClick} size={size} aria-label="Pronounce">
      <VolumeUpIcon fontSize={size} />
    </IconButton>
  );
}
