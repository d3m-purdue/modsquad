// Execute tangelo service to kill this process
//
// See https://stackoverflow.com/a/35385518/1886928.
export default function stopProcess (s) {
	// Read in the NIST config file.
	json('/stopProcess', returncode => {
		console.log('stop return code was',returncode)
	})

}
