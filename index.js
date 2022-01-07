const { getInput, debug, setFailed, setOutput, getBooleanInput } = require("@actions/core")

const getInputs = () => {
	try {
		const token = getInput("argocdToken", { required: true })
		const endpoint = getInput("argocdEndpoint", { required: true })
		debug(`endpoint=${endpoint}`)
		const applicationName = getInput("applicationName", { required: true })
		debug(`applicationName=${applicationName}`)
		const helmRepoUrl = getInput("helmRepoUrl", { required: true })
		debug(`helmRepoUrl=${helmRepoUrl}`)
		const helmChartVersion = getInput("helmChartVersion", { required: true })
		debug(`helmChartVersion=${helmChartVersion}`)
		const helmChartName = getInput("helmChartName", { required: true })
		debug(`helmChartName=${helmChartName}`)

		//Non required values
		const applicationNamespace = getInput("applicationNamespace") || "default"
		debug(`applicationNamespace=${applicationNamespace}`)
		const applicationProject = getInput("applicationProject")
		debug(`applicationProject=${applicationProject}`)
		const applicationParams = getInput("applicationParams")
		debug(`applicationParams=${applicationParams}`)
		const action = getInput("actionName") || "create"
		debug(`action=${action}`)
		const maxRetry = getInput("maxRetry") || "5"
		debug(`maxRetry=${maxRetry}`)
		const tts = getInput("tts") || "10"
		debug(`tts=${tts}`)
		const destClusterName = getInput("destClusterName")
		debug(`destClusterName=${destClusterName}`)
		const doSync = getBooleanInput("doSync")
		debug(`doSync=${doSync}`)

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
			actionName, action,
			doSync,
			maxRetry,
			tts
		}
	} catch (error) {
		setFailed(error.message)
	}
}

const syncApplication = (inputs = getInputs()) => {
	fetch(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}/sync`)
		.catch(err => setFailed(err.message))
		.then(r => r.json())
		.then(jsonObj => setOutput("application", JSON.stringify(jsonObj)))
}

const createApplication = (inputs = getInputs()) => {
	specs = generateSpecs(inputs)
	return fetch(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`, { method: "POST", body: JSON.stringify(specs) })
		.catch(err => setFailed(err.messsage))
		.then(r => r.json())
		.then(jsonObj => setOutput("application", JSON.stringify(jsonObj)))
}

const readApplication = (inputs = getInputs()) => {
	return fetch(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`)
		.catch(err => setFailed(err.message))
		.then((r) => r.json())
		.then(jsonObj => setOutput("application", JSON.stringify(jsonObj)))
}

const updateApplication = (inputs = getInputs()) => {
	specs = generateSpecs(inputs)
	return fetch(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`, { method: "PATCH", body: JSON.stringify(specs) })
		.catch(err => setFailed(err.messsage))
}

const deleteApplication = (inputs = getInputs()) => {
	return fetch(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`, { method: "DELETE" })
		.catch(err => setFailed(err.message))
}

const createHelmParam = (name, value) => {
	return { "name": name, "value": value }
}

const parseApplicationParams = (appParams = "") => {
	return appParams.split(";").map((v) => {
		const { name, value } = v.split("=", 2)
		return createHelmParam(name, value)
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
					"parameters": `${helmParameters}`
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

	switch (inputs.actionName) {
		case "delete":
			deleteApplication(inputs)
		case "get":
		case "read":
			readApplication(inputs)
		case "create":
			createApplication(inputs)
		case "update":
			updateApplication(inputs)
		default:
			setFailed(new Error(`${input.actionName} does not exists in (create, get|read, update, delete)`))
	}
}

main()