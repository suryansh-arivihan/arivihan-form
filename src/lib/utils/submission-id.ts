export function generateSubmissionId(counter: number): string {
  const year = new Date().getFullYear();
  const paddedCounter = String(counter).padStart(5, "0");
  return `ANI-${year}-${paddedCounter}`;
}

export function parseSubmissionId(id: string): { year: number; counter: number } | null {
  const match = id.match(/^ANI-(\d{4})-(\d{5})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    counter: parseInt(match[2], 10),
  };
}

export function maskMobileNumber(mobile: string): string {
  if (mobile.length !== 10) return mobile;
  return `${mobile.slice(0, 5)}XXXXX`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("hi-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
