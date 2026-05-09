export function createRunLog(runState) {
  if (!runState.eventLog) {
    runState.eventLog = [];
  }

  if (!runState.runId) {
    runState.runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  return runState;
}

export function logEvent(runState, type, payload = {}) {
  if (!runState) return runState;

  createRunLog(runState);

  const event = {
    index: runState.eventLog.length + 1,
    timestamp: new Date().toISOString(),
    runId: runState.runId,
    level: (runState.levelIndex || 0) + 1,
    wave: runState.waveIndex || 0,
    type,
    playerHp: runState.player?.hp ?? null,
    playerMaxHp: runState.player?.maxHp ?? null,
    playerClass: runState.player?.classId ?? null,
    payload
  };

  runState.eventLog.push(event);
  return runState;
}

export function exportRunLogCsv(runState) {
  const events = runState?.eventLog || [];

  const rows = [
    [
      "index",
      "timestamp",
      "runId",
      "level",
      "wave",
      "type",
      "playerHp",
      "playerMaxHp",
      "playerClass",
      "payload"
    ]
  ];

  events.forEach(event => {
    rows.push([
      event.index,
      event.timestamp,
      event.runId,
      event.level,
      event.wave,
      event.type,
      event.playerHp,
      event.playerMaxHp,
      event.playerClass,
      JSON.stringify(event.payload || {})
    ]);
  });

  const csv = rows
    .map(row =>
      row
        .map(value => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${runState?.runId || "elf_run"}_battle_report.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
