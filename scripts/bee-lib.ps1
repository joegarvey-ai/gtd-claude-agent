#Requires -Version 5.1
<#
.SYNOPSIS
    Shared helpers for the Bee sync scripts. Dot-sourced by bee-sync-scheduled.ps1
    and bee-stream-watcher.ps1 so the completeness gate is defined in ONE place and
    the two scripts can't drift apart.

.DESCRIPTION
    The key export is Test-BeeCaptureReady, the deterministic completeness gate:
    a capture is only "ready" to process once Bee marks it COMPLETED, it has a real
    end_time, and it hasn't been touched (updated_at) within a settle window — so we
    never write a meeting note that Bee is still enriching. Captures still CAPTURING
    are skipped; ones stuck CAPTURING past a threshold are flagged "stuck" so they can
    be surfaced for review instead of silently lost.
#>

# Parse the top metadata block of a Bee raw capture. Bee writes metadata as a
# markdown bullet list under the "# Conversation <id>" H1, e.g.:
#   - start_time: 2026-07-01T21:36:50.013Z
#   - end_time: n/a
#   - state: CAPTURING
#   - updated_at: 2026-07-01T21:37:39.194Z
# Only the block BEFORE the first "## " section is parsed — later sections (e.g.
# "## Primary Location") repeat keys like created_at and would otherwise be misread.
function Get-BeeMetadata {
    param([string]$Path)

    $meta = @{}
    if (-not (Test-Path $Path)) { return $meta }
    foreach ($line in [System.IO.File]::ReadAllLines($Path)) {
        if ($line -match '^\s*##\s') { break }            # stop at first section header
        if ($line -match '^\s*-\s*([A-Za-z_]+):\s*(.*)$') {
            $key = $matches[1].ToLower()
            if (-not $meta.ContainsKey($key)) { $meta[$key] = $matches[2].Trim() }  # first wins
        }
    }
    return $meta
}

# Try to parse a Bee ISO-8601 timestamp; returns [datetime] (UTC) or $null.
function ConvertFrom-BeeTime {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value) -or $Value -eq 'n/a') { return $null }
    try {
        return [datetime]::Parse($Value, [System.Globalization.CultureInfo]::InvariantCulture,
            [System.Globalization.DateTimeStyles]::AdjustToUniversal -bor [System.Globalization.DateTimeStyles]::AssumeUniversal)
    } catch { return $null }
}

<#
.SYNOPSIS
    The completeness gate. Returns a PSCustomObject: Status + Reason.
.OUTPUTS
    Status is one of:
      ready      COMPLETED, has end_time, and settled (updated_at >= SettleMinutes ago). Process it.
      capturing  Still CAPTURING and within StuckHours of start. Skip; check again next sync.
      unsettled  COMPLETED but updated_at is within the settle window. Skip; let enrichment land.
      stuck      CAPTURING longer than StuckHours. Skip, but surface for review.
      unknown    Couldn't determine state. Skip (treated like capturing, surfaced if old).
#>
function Test-BeeCaptureReady {
    param(
        [string]$Path,
        [int]$SettleMinutes = 10,
        [int]$StuckHours = 24,
        [datetime]$Now = ([datetime]::UtcNow)
    )

    $meta  = Get-BeeMetadata -Path $Path
    $state = if ($meta.ContainsKey('state')) { $meta['state'].ToUpper() } else { '' }
    $end   = ConvertFrom-BeeTime $meta['end_time']
    $upd   = ConvertFrom-BeeTime $meta['updated_at']
    $start = ConvertFrom-BeeTime $meta['start_time']

    if ($state -eq 'COMPLETED') {
        if (-not $end) {
            return [pscustomobject]@{ Status = 'unsettled'; Reason = 'COMPLETED but no end_time yet' }
        }
        if ($upd -and (($Now - $upd).TotalMinutes -lt $SettleMinutes)) {
            $mins = [math]::Round(($Now - $upd).TotalMinutes, 1)
            return [pscustomobject]@{ Status = 'unsettled'; Reason = "COMPLETED but updated ${mins}m ago (< ${SettleMinutes}m settle window)" }
        }
        return [pscustomobject]@{ Status = 'ready'; Reason = 'COMPLETED and settled' }
    }

    if ($state -eq 'CAPTURING') {
        if ($start -and (($Now - $start).TotalHours -ge $StuckHours)) {
            $hrs = [math]::Round(($Now - $start).TotalHours, 1)
            return [pscustomobject]@{ Status = 'stuck'; Reason = "CAPTURING for ${hrs}h (>= ${StuckHours}h) — likely abandoned" }
        }
        return [pscustomobject]@{ Status = 'capturing'; Reason = 'still CAPTURING' }
    }

    # Unknown / missing state — be conservative, don't process. Surface if it's old.
    if ($start -and (($Now - $start).TotalHours -ge $StuckHours)) {
        return [pscustomobject]@{ Status = 'stuck'; Reason = "state='$state' unresolved for >= ${StuckHours}h" }
    }
    return [pscustomobject]@{ Status = 'unknown'; Reason = "unrecognized state '$state'" }
}
