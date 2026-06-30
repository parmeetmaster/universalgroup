<?php
require_once __DIR__ . '/includes/api.php';

$number = trim($_GET['number'] ?? '');
$date = trim($_GET['date'] ?? '');

$flight = null;
$error = false;

if ($number !== '') {
    $data = get_flight($number, $date ?: null);
    if ($data !== null) {
        $flight = $data['flight'] ?? $data;
    } else {
        $error = true;
    }
}

$page_meta = [
    'title' => $number ? 'Flight ' . strtoupper($number) : 'Flight Tracker',
    'description' => 'Track any flight in real-time. Get departure, arrival, and status information.',
];

include __DIR__ . '/includes/header.php';
?>

<div class="container">
    <h1 style="font-size: var(--font-size-3xl); font-weight: 800; margin-bottom: var(--space-sm);">Flight Tracker</h1>
    <p class="text-muted" style="margin-bottom: var(--space-xl);">Track any flight in real-time</p>

    <form action="/flight.php" method="get" class="flight-search">
        <div class="form-group">
            <label class="form-label" for="flight-number">Flight Number</label>
            <input type="text" id="flight-number" name="number" class="form-input" placeholder="e.g. AA100, BA265" value="<?php echo htmlspecialchars($number); ?>" required>
        </div>
        <div class="form-group">
            <label class="form-label" for="flight-date">Date (Optional)</label>
            <input type="date" id="flight-date" name="date" class="form-input" value="<?php echo htmlspecialchars($date); ?>">
        </div>
        <button type="submit" class="btn-search">
            <i class="fa-solid fa-magnifying-glass"></i> Track Flight
        </button>
    </form>

    <?php if ($number === ''): ?>
    <!-- Empty state before search -->
    <div style="text-align: center; padding: var(--space-3xl) 0;">
        <i class="fa-solid fa-plane" style="font-size: 4rem; color: var(--text-subtle); opacity: 0.3; margin-bottom: var(--space-lg);"></i>
        <h3 style="color: var(--text-primary); margin-bottom: var(--space-sm);">Enter a Flight Number</h3>
        <p class="text-muted">Search for any flight to see real-time status, departure, and arrival details.</p>
    </div>

    <?php elseif ($error || $flight === null): ?>
    <div style="text-align: center; padding: var(--space-3xl) 0;">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; color: var(--color-warning); margin-bottom: var(--space-lg);"></i>
        <h3 style="color: var(--text-primary); margin-bottom: var(--space-sm);">Flight Not Found</h3>
        <p class="text-muted">Could not find flight "<?php echo htmlspecialchars(strtoupper($number)); ?>". Please check the flight number and try again.</p>
    </div>

    <?php else:
        $airline = $flight['airline'] ?? '';
        $flight_num = ($flight['airlineCode'] ?? '') . ($flight['flightNumber'] ?? $number);
        // status is an object: {status, statusDescription, color, canceled, diverted, phase, ...}
        $status_obj = $flight['status'] ?? [];
        $status_text = is_array($status_obj) ? ($status_obj['status'] ?? '') : (string)$status_obj;
        $status_desc = is_array($status_obj) ? ($status_obj['statusDescription'] ?? '') : '';
        $status_color = is_array($status_obj) ? ($status_obj['color'] ?? 'green') : 'green';
        $is_canceled = is_array($status_obj) ? ($status_obj['canceled'] ?? false) : false;

        // Departure info: {code, name, city, country, gate, terminal, scheduledTime, actualTime, timezone}
        $dep = $flight['departure'] ?? [];
        $dep_code = $dep['code'] ?? '';
        $dep_city = $dep['city'] ?? '';
        $dep_name = $dep['name'] ?? '';
        $dep_terminal = $dep['terminal'] ?? '';
        $dep_gate = $dep['gate'] ?? '';
        $dep_scheduled = $dep['scheduledTime'] ?? '';
        $dep_actual = $dep['actualTime'] ?? '';
        $dep_tz = $dep['timezone'] ?? '';

        // Arrival info
        $arr = $flight['arrival'] ?? [];
        $arr_code = $arr['code'] ?? '';
        $arr_city = $arr['city'] ?? '';
        $arr_name = $arr['name'] ?? '';
        $arr_terminal = $arr['terminal'] ?? '';
        $arr_gate = $arr['gate'] ?? '';
        $arr_scheduled = $arr['scheduledTime'] ?? '';
        $arr_actual = $arr['actualTime'] ?? '';
        $arr_tz = $arr['timezone'] ?? '';

        // Equipment is object: {iata, name}
        $equip_obj = $flight['equipment'] ?? [];
        $equipment = is_array($equip_obj) ? ($equip_obj['name'] ?? $equip_obj['iata'] ?? '') : (string)$equip_obj;
        $duration = $flight['duration'] ?? '';
        $tail = $flight['tailNumber'] ?? '';
        $progress = 0;
        // Estimate progress from status
        if ($is_canceled) { $progress = 0; }
        elseif (stripos($status_text, 'land') !== false || stripos($status_text, 'arriv') !== false) { $progress = 100; }
        elseif (stripos($status_text, 'en route') !== false || stripos($status_text, 'depart') !== false) { $progress = 50; }

        // Status badge class based on API color field
        $status_class = 'badge';
        if ($is_canceled) {
            $status_class .= ' badge-error';
        } elseif ($status_color === 'green') {
            $status_class .= ' badge-success';
        } elseif ($status_color === 'yellow' || $status_color === 'orange') {
            $status_class .= ' badge-warning';
        } elseif ($status_color === 'red') {
            $status_class .= ' badge-error';
        } else {
            $status_class .= ' badge-success';
        }
    ?>
    <div class="flight-card">
        <div class="flight-card-header">
            <div>
                <span class="flight-airline"><?php echo htmlspecialchars($airline); ?></span>
                <span class="flight-number" style="margin-left: var(--space-md);"><?php echo htmlspecialchars(strtoupper($flight_num)); ?></span>
            </div>
            <?php if ($status_text): ?>
            <span class="<?php echo $status_class; ?>"><?php echo htmlspecialchars($status_text); ?><?php if ($status_desc): ?> &mdash; <?php echo htmlspecialchars($status_desc); ?><?php endif; ?></span>
            <?php endif; ?>
        </div>

        <div class="flight-route">
            <div class="flight-endpoint departure">
                <div class="flight-code"><?php echo htmlspecialchars($dep_code); ?></div>
                <?php if ($dep_city): ?>
                <div class="flight-city"><?php echo htmlspecialchars($dep_city); ?></div>
                <?php endif; ?>
                <?php if ($dep_terminal || $dep_gate): ?>
                <div style="font-size: var(--font-size-xs); color: var(--text-subtle); margin-top: var(--space-xs);">
                    <?php if ($dep_terminal): ?>Terminal <?php echo htmlspecialchars($dep_terminal); ?><?php endif; ?>
                    <?php if ($dep_terminal && $dep_gate): ?> &middot; <?php endif; ?>
                    <?php if ($dep_gate): ?>Gate <?php echo htmlspecialchars($dep_gate); ?><?php endif; ?>
                </div>
                <?php endif; ?>
                <?php if ($dep_scheduled): ?>
                <div style="font-size: var(--font-size-xs); color: var(--text-subtle); margin-top: var(--space-sm);">Scheduled: <?php echo htmlspecialchars($dep_scheduled); ?></div>
                <?php endif; ?>
                <?php if ($dep_actual): ?>
                <div class="flight-time"><?php echo htmlspecialchars($dep_actual); ?></div>
                <?php endif; ?>
            </div>

            <div class="flight-connector">
                <div class="flight-connector-line"></div>
                <i class="fa-solid fa-plane flight-plane-icon"></i>
            </div>

            <div class="flight-endpoint arrival">
                <div class="flight-code"><?php echo htmlspecialchars($arr_code); ?></div>
                <?php if ($arr_city): ?>
                <div class="flight-city"><?php echo htmlspecialchars($arr_city); ?></div>
                <?php endif; ?>
                <?php if ($arr_terminal || $arr_gate): ?>
                <div style="font-size: var(--font-size-xs); color: var(--text-subtle); margin-top: var(--space-xs);">
                    <?php if ($arr_terminal): ?>Terminal <?php echo htmlspecialchars($arr_terminal); ?><?php endif; ?>
                    <?php if ($arr_terminal && $arr_gate): ?> &middot; <?php endif; ?>
                    <?php if ($arr_gate): ?>Gate <?php echo htmlspecialchars($arr_gate); ?><?php endif; ?>
                </div>
                <?php endif; ?>
                <?php if ($arr_scheduled): ?>
                <div style="font-size: var(--font-size-xs); color: var(--text-subtle); margin-top: var(--space-sm);">Scheduled: <?php echo htmlspecialchars($arr_scheduled); ?></div>
                <?php endif; ?>
                <?php if ($arr_actual): ?>
                <div class="flight-time"><?php echo htmlspecialchars($arr_actual); ?></div>
                <?php endif; ?>
            </div>
        </div>

        <?php if ($progress > 0): ?>
        <div style="padding: 0 var(--space-xl) var(--space-lg);">
            <div class="flight-progress">
                <div class="flight-progress-bar" style="width: <?php echo min(100, $progress); ?>%;"></div>
            </div>
        </div>
        <?php endif; ?>

        <?php if ($equipment || $duration || $tail): ?>
        <div style="display: flex; justify-content: space-around; padding: var(--space-lg) var(--space-xl); border-top: var(--border-subtle); background: var(--bg-elevated);">
            <?php if ($equipment): ?>
            <div style="text-align: center;">
                <div style="font-size: var(--font-size-xs); font-weight: 500; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: var(--space-xs);">Aircraft</div>
                <div style="font-size: var(--font-size-sm); font-weight: 600;"><?php echo htmlspecialchars($equipment); ?></div>
            </div>
            <?php endif; ?>
            <?php if ($duration): ?>
            <div style="text-align: center;">
                <div style="font-size: var(--font-size-xs); font-weight: 500; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: var(--space-xs);">Duration</div>
                <div style="font-size: var(--font-size-sm); font-weight: 600;"><?php echo htmlspecialchars($duration); ?></div>
            </div>
            <?php endif; ?>
            <?php if ($tail): ?>
            <div style="text-align: center;">
                <div style="font-size: var(--font-size-xs); font-weight: 500; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: var(--space-xs);">Tail Number</div>
                <div style="font-size: var(--font-size-sm); font-weight: 600;"><?php echo htmlspecialchars($tail); ?></div>
            </div>
            <?php endif; ?>
        </div>
        <?php endif; ?>
    </div>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
