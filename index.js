const { getInput, info, setFailed, setOutput, getBooleanInput, debug, group } = require("@actions/core")
const fetch = require("node-fetch")

const getInputs = () => {
	try {
		const token = getInput("argocdToken", { required: true })
		const endpoint = getInput("argocdEndpoint", { required: true })
		const applicationName = getInput("applicationName", { required: true })
		const helmRepoUrl = getInput("helmRepoUrl", { required: true })
		const helmChartVersion = getInput("helmChartVersion", { required: true })
		const helmChartName = getInput("helmChartName", { required: true })

		//Non required values
		const applicationNamespace = getInput("applicationNamespace") || "default"
		const applicationProject = getInput("applicationProject")
		const applicationParams = getInput("applicationParams")
		const action = getInput("actionName") || "create"
		const maxRetry = getInput("maxRetry") || "5"
		const tts = getInput("tts") || "10"
		const destClusterName = getInput("destClusterName")
		const doSync = getBooleanInput("doSync")

		return {
			token,
			endpoint,
			destClusterName,
			applicationName,
			applicationNamespace,
			applicationProject,
			applicationParams,
			helmChartName,
			helmChartVersion,
			helmRepoUrl,
			doSync,
			maxRetry,
			tts,
			action
		}
	} catch (error) {
		setFailed(error.message)
	}
}

const generateOpts = (method = "", bearerToken = "", bodyObj) => {
	if (method == "delete" || method == "get") {
		return {
			method, header: { "Authorization": `Bearer ${bearerToken}` }
		}
	}
	const return_value = {
		method,
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${bearerToken}`
		},
		body: JSON.stringify(bodyObj)
	}
	info(JSON.stringify(return_value))
	return return_value
}

const checkResponse = (response) => {
	if (response.status >= 200 && response.status < 300) {
		return response;
	}
	throw new Error(response.statusText);
}

const syncApplication = (inputs = getInputs()) => {
	fetch.default(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}/sync`, generateOpts("get", inputs.token, null))
		.then(r => r.json())
		.then(jsonObj => setOutput("application", JSON.stringify(jsonObj)))
		.catch(err => setFailed(err.message))
}

const createApplication = (inputs = getInputs()) => {
	specs = generateSpecs(inputs)
	info(`Sending request to ${inputs.endpoint}/api/v1/applications`)
	return fetch.default(`${inputs.endpoint}/api/v1/applications`, generateOpts("post", inputs.token, specs))
		.then(checkResponse)
		.then(r => r.json())
		.then(jsonObj => setOutput("application", JSON.stringify(jsonObj)))
		.catch(err => setFailed(err))
}

const readApplication = (inputs = getInputs()) => {
	info(`Sending request to ${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`)
	return fetch.default(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`, generateOpts("get", inputs.token, null))
		.then((r) => r.json())
		.then(jsonObj => setOutput("application", JSON.stringify(jsonObj)))
		.catch(err => setFailed(err))
}

const updateApplication = (inputs = getInputs()) => {
	specs = generateSpecs(inputs)
	return fetch.default(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`, generateOpts("patch", inputs.token, specs))
		.then(checkResponse)
		.catch(err => setFailed(err))
}

const deleteApplication = (inputs = getInputs()) => {
	return fetch.default(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`, generateOpts("delete", inputs.token, null))
		.then(checkResponse)
		.catch(err => setFailed(err))
}

const parseApplicationParams = (appParams = "") => {
	return appParams.split(";").map((v) => {
		const [name, value] = v.split("=", 2)
		return { name, value }
	})
}

const generateSpecs = (inputs = getInputs()) => {
	helmParameters = parseApplicationParams(inputs.applicationParams)
	return {
		"metadata": { "name": `${inputs.applicationName}`, "namespace": "default" },
		"spec": {
			"source": {
				"repoURL": `${inputs.helmRepoUrl}`,
				"targetRevision": `${inputs.helmChartVersion}`,
				"helm": {
					"parameters": helmParameters
				},
				"chart": `${inputs.helmChartName}`
			},
			"destination": {
				"name": `${inputs.destClusterName}`, "namespace": `${inputs.applicationNamespace}`
			},
			"project": `${inputs.applicationProject}`,
			"syncPolicy": {}
		}
	}
}

const main = () => {
	inputs = getInputs()
	prom = null
	switch (inputs.action) {
		case "delete":
			deleteApplication(inputs)
			break
		case "get":
		case "read":
			prom = readApplication(inputs)
			break
		case "create":
			prom = createApplication(inputs)
			break
		case "update":
			prom = updateApplication(inputs)
			break
		default:
			setFailed(new Error(`${inputs.action} does not exists in (create, get|read, update, delete)`))
			return
	}
	if (prom != null) {
		prom.then(() => {
			if (inputs.doSync) syncApplication(inputs)
		})

	}
}

main()