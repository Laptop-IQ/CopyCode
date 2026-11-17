function download(filename, mimeType, content) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

const cleanGroups = (groups) =>
  groups.map((group) => ({
    title: group.title || "Untitled",
    tag: group.tag || "other",
    entryType: group.entryType || "single",
    language: group.language || "bash",
    commands: (group.commands || []).map((command) => ({
      label: command.label || "",
      cmd: command.cmd || "",
    })),
  }));

export function exportJson(groups) {
  download(
    `cmdkit-library-${stamp()}.json`,
    "application/json",
    JSON.stringify({ exportedAt: new Date().toISOString(), groups: cleanGroups(groups) }, null, 2),
  );
}

export function exportMarkdown(groups) {
  const body = cleanGroups(groups)
    .map((group) => {
      const blocks = group.commands
        .map((command) => {
          const heading = command.label ? `**${command.label}**\n\n` : "";
          const fence = group.language === "bash" ? "bash" : group.language;

          return `${heading}\`\`\`${fence}\n${command.cmd}\n\`\`\``;
        })
        .join("\n\n");

      return `## ${group.title}\n\n_Category: ${group.tag}_\n\n${blocks}`;
    })
    .join("\n\n---\n\n");

  download(
    `cmdkit-library-${stamp()}.md`,
    "text/markdown",
    `# Command library\n\n${body}\n`,
  );
}
