const { getInput, info, setFailed, setOutput, getBooleanInput, debug, group } = require("@actions/core")
const fetch = require("node-fetch")

const getInputs = () => {
	try {
		const token = getInput("argocdToken", { required: true })
		const endpoint = getInput("argocdEndpoint", { required: true })
		info(`endpoint=${endpoint}`)
		const applicationName = getInput("applicationName", { required: true })
		info(`applicationName=${applicationName}`)
		const helmRepoUrl = getInput("helmRepoUrl", { required: true })
		info(`helmRepoUrl=${helmRepoUrl}`)
		const helmChartVersion = getInput("helmChartVersion", { required: true })
		info(`helmChartVersion=${helmChartVersion}`)
		const helmChartName = getInput("helmChartName", { required: true })
		info(`helmChartName=${helmChartName}`)

		//Non required values
		const applicationNamespace = getInput("applicationNamespace") || "default"
		info(`applicationNamespace=${applicationNamespace}`)
		const applicationProject = getInput("applicationProject")
		info(`applicationProject=${applicationProject}`)
		const applicationParams = getInput("applicationParams")
		info(`applicationParams=${applicationParams}`)
		const action = getInput("actionName") || "create"
		info(`action=${action}`)
		const maxRetry = getInput("maxRetry") || "5"
		info(`maxRetry=${maxRetry}`)
		const tts = getInput("tts") || "10"
		info(`tts=${tts}`)
		const destClusterName = getInput("destClusterName")
		info(`destClusterName=${destClusterName}`)
		const doSync = getBooleanInput("doSync")
		info(`doSync=${doSync}`)

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

const syncApplication = (inputs = getInputs()) => {
	fetch.default(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}/sync`)
		.catch(err => setFailed(err.message))
		.then(r => r.json())
		.then(jsonObj => setOutput("application", JSON.stringify(jsonObj)))
}

const createApplication = (inputs = getInputs()) => {
	specs = generateSpecs(inputs)
	info("specs=" + JSON.stringify(specs))
	return fetch.default(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`, { method: "POST", body: JSON.stringify(specs) })
		.catch(err => setFailed(err.messsage))
		.then(r => r.json())
		.then(jsonObj => setOutput("application", JSON.stringify(jsonObj)))
}

const readApplication = (inputs = getInputs()) => {
	return fetch.default(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`)
		.catch(err => setFailed(err.message))
		.then((r) => r.json())
		.then(jsonObj => setOutput("application", JSON.stringify(jsonObj)))
}

const updateApplication = (inputs = getInputs()) => {
	specs = generateSpecs(inputs)
	return fetch.default(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`, { method: "PATCH", body: JSON.stringify(specs) })
		.catch(err => setFailed(err.messsage))
}

const deleteApplication = (inputs = getInputs()) => {
	return fetch.default(`${inputs.endpoint}/api/v1/applications/${inputs.applicationName}`, { method: "DELETE" })
		.catch(err => setFailed(err.message))
}

const parseApplicationParams = (appParams = "") => {
	return appParams.split(";").map((v) => {
		const [name, value] = v.split("=", 2)
		return { "name": name, "value": value }
	})
}

const generateSpecs = (inputs = getInputs()) => {
	helmParameters = parseApplicationParams(inputs.applicationParams).map(v => JSON.stringify(v))
	return {
		"metadata": { "name": `${inputs.applicationName}`, "namespace": "default" },
		"spec": {
			"source": {
				"repoURL": `${inputs.helmRepoUrl}`,
				"targetRevision": `${inputs.helmChartVersion}`,
				"helm": {
					"parameters": [`${helmParameters}`]
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
	switch (inputs.action) {
		case "delete":
			deleteApplication(inputs)
			break
		case "get":
		case "read":
			readApplication(inputs)
			break
		case "create":
			createApplication(inputs)
			break
		case "update":
			updateApplication(inputs)
			break
		default:
			setFailed(new Error(`${inputs.action} does not exists in (create, get|read, update, delete)`))
	}
}

main()