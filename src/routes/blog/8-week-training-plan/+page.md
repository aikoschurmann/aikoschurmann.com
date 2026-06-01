---
layout: blog
title: "8-Week Training Plan"
date: "2026-04-20"
author: "Aiko Schurmann"
description: "A comprehensive 8-week training protocol combining Norwegian 4x4 intervals, cycling, and running."
tags:
  - "TRAINING"
  - "ATHLETICS"
showInBlog: false
---

<script>
  import TrainingPlanEmbed from '$lib/components/TrainingPlanEmbed.svelte';

  const weeklyHeaders = ['Week', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyRows = [
    [
      { val: '1', type: 'header' },
      { val: '40m', type: 'run' },
      { val: '40m (4x4)', type: 'interval' },
      { val: 'Rest', type: 'rest' },
      { val: '45m', type: 'cycle' },
      { val: '35m + 4x20s', type: 'sprint' },
      { val: '60m', type: 'cycle' },
      { val: 'Rest', type: 'rest' }
    ],
    [
      { val: '2', type: 'header' },
      { val: '45m', type: 'run' },
      { val: '45m (4x4)', type: 'interval' },
      { val: 'Rest', type: 'rest' },
      { val: '45m', type: 'cycle' },
      { val: '40m + 5x20s', type: 'sprint' },
      { val: '65m', type: 'cycle' },
      { val: 'Rest', type: 'rest' }
    ],
    [
      { val: '3', type: 'header' },
      { val: '50m', type: 'run' },
      { val: '50m (4x4)', type: 'interval' },
      { val: 'Rest', type: 'rest' },
      { val: '45m', type: 'cycle' },
      { val: '45m + 6x20s', type: 'sprint' },
      { val: '70m', type: 'cycle' },
      { val: 'Rest', type: 'rest' }
    ],
    [
      { val: '4 (Del)', type: 'header' },
      { val: '35m', type: 'run' },
      { val: '35m (2x4)', type: 'interval' },
      { val: 'Rest', type: 'rest' },
      { val: '30m', type: 'cycle' },
      { val: '30m + 4x10s', type: 'sprint' },
      { val: '45m', type: 'cycle' },
      { val: 'Rest', type: 'rest' }
    ],
    [
      { val: '5', type: 'header' },
      { val: '35m', type: 'run' },
      { val: '55m (5x4)', type: 'interval' }, // Increase to 5 sets
      { val: 'Rest', type: 'rest' },
      { val: '60m', type: 'cycle' },
      { val: '35m + 6x12s', type: 'sprint' }, // Shift to Strides for economy
      { val: '60m', type: 'run' },
      { val: 'Rest', type: 'rest' }
    ],
    [
      { val: '6', type: 'header' },
      { val: '40m', type: 'run' },
      { val: '60m (5x4)', type: 'interval' },
      { val: 'Rest', type: 'rest' },
      { val: '65m', type: 'cycle' },
      { val: '40m + 8x12s', type: 'sprint' },
      { val: '65m', type: 'run' },
      { val: 'Rest', type: 'rest' }
    ],
    [
      { val: '7', type: 'header' },
      { val: '45m', type: 'run' },
      { val: '65m (6x4)', type: 'interval' }, // Peak intensity volume
      { val: 'Rest', type: 'rest' },
      { val: '70m', type: 'cycle' },
      { val: '40m + 10x12s', type: 'sprint' },
      { val: '75m', type: 'run' },
      { val: 'Rest', type: 'rest' }
    ],
    [
      { val: '8 (Del)', type: 'header' },
      { val: '30m', type: 'run' },
      { val: '40m (2x4)', type: 'interval' },
      { val: 'Rest', type: 'rest' },
      { val: '40m', type: 'cycle' },
      { val: '30m + 4x10s', type: 'sprint' },
      { val: '50m', type: 'run' },
      { val: 'Rest', type: 'rest' }
    ]
  ];

  const intervalHeaders = ['Week', 'Total', 'Warm-Up', 'Interval Sets', 'Cool-Down'];
  const intervalRows = [
    [{ val: '1', type: 'header' }, { val: '40 min' }, { val: '10 min' }, { val: '4 sets (25m total)', type: 'interval' }, { val: '5 min' }],
    [{ val: '2', type: 'header' }, { val: '45 min' }, { val: '12 min' }, { val: '4 sets (25m total)', type: 'interval' }, { val: '8 min' }],
    [{ val: '3', type: 'header' }, { val: '50 min' }, { val: '15 min' }, { val: '4 sets (25m total)', type: 'interval' }, { val: '10 min' }],
    [{ val: '4 (Del)', type: 'header' }, { val: '35 min' }, { val: '10 min' }, { val: '2 sets (11m total)', type: 'interval' }, { val: '14 min' }],
    [{ val: '5', type: 'header' }, { val: '55 min' }, { val: '15 min' }, { val: '5 sets (32m total)', type: 'interval' }, { val: '8 min' }],
    [{ val: '6', type: 'header' }, { val: '60 min' }, { val: '15 min' }, { val: '5 sets (32m total)', type: 'interval' }, { val: '13 min' }],
    [{ val: '7', type: 'header' }, { val: '65 min' }, { val: '15 min' }, { val: '6 sets (39m total)', type: 'interval' }, { val: '11 min' }],
    [{ val: '8 (Del)', type: 'header' }, { val: '40 min' }, { val: '10 min' }, { val: '2 sets (11m total)', type: 'interval' }, { val: '19 min' }]
  ];

  const volumeHeaders = ['Week', 'Total Run', 'Total Cycle', 'Total Load'];
  const volumeRows = [
    [{ val: '1', type: 'header' }, { val: '115m', type: 'run' }, { val: '105m', type: 'cycle' }, { val: '220m', type: 'load' }],
    [{ val: '2', type: 'header' }, { val: '130m', type: 'run' }, { val: '110m', type: 'cycle' }, { val: '240m', type: 'load' }],
    [{ val: '3', type: 'header' }, { val: '145m', type: 'run' }, { val: '115m', type: 'cycle' }, { val: '260m', type: 'load' }],
    [{ val: '4 (Del)', type: 'header' }, { val: '100m', type: 'run' }, { val: '75m', type: 'cycle' }, { val: '175m', type: 'load' }],
    [{ val: '5', type: 'header' }, { val: '185m', type: 'run' }, { val: '60m', type: 'cycle' }, { val: '245m', type: 'load' }],
    [{ val: '6', type: 'header' }, { val: '200m', type: 'run' }, { val: '65m', type: 'cycle' }, { val: '265m', type: 'load' }],
    [{ val: '7', type: 'header' }, { val: '215m', type: 'run' }, { val: '70m', type: 'cycle' }, { val: '285m', type: 'load' }],
    [{ val: '8 (Del)', type: 'header' }, { val: '150m', type: 'run' }, { val: '40m', type: 'cycle' }, { val: '190m', type: 'load' }]
  ];
</script>


## Weekly Schedule

<TrainingPlanEmbed 
  headers={weeklyHeaders} 
  rows={weeklyRows} 
  showLegend={true} 
  type="weekly"
/>

## Interval


<TrainingPlanEmbed 
  headers={intervalHeaders} 
  rows={intervalRows} 
  type="interval"
/>

## Volume


<TrainingPlanEmbed 
  headers={volumeHeaders} 
  rows={volumeRows} 
  type="volume"
/>