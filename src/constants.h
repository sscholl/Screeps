#define PHASE_SEARCH    'search'
#define PHASE_TASK      'task'

#define PHASE_HARVEST    'harvest'
#define PHASE_DELIVER    'deliver'
#define PHASE_UPGRADE    'upgrade'

#define BODY_DEFAULT     	'default'
#define BODY_HARVESTER    	'harvester'
#define BODY_CARRIER    	'carrier'
#define BODY_CARRIER_TINY   'carrier_tiny'
#define BODY_UPGRADER    	'upgrader'
#define BODY_HEALER        	'healer'
#define BODY_RANGER        	'ranger'


#define TASK_HARVEST 'T_HARVEST' // source: harvest energy from a source
#define TASK_COLLECT 'T_COLLECT' // source: collect dropped energy
#define TASK_GATHER 'T_GATHER' // source: collect energy from a creep or structure
#define TASK_DELIVER 'T_DELIVER' // sink: deliver energy to a energy sink
#define TASK_UPGRADE 'T_UPGRADE' // sink: upgrade controller
#define TASK_BUILD   'T_BUILD'   // sink: build a construction site
#define TASK_REPAIR  'T_REPAIR'  // sink: repair a structure
#define TASK_FILLSTORAGE 'T_FILLSTORAGE' //source+sink: retrieve source from the storage link and fill that to the storage

#define TASK_MOVE  'T_MOVE'