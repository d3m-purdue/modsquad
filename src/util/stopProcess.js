// Execute tangelo service to kill this process
//
// 

import { json } from 'd3-request';

export default function stopProcess () {
	// Read in the NIST config file.
	json('/stopProcess', returncode => {
		console.log('stop return code was',returncode)
	})

}
