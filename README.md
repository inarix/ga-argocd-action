# ga-argocd-action
GithubAction which handle base CRUD on given application name

## Inputs
###  `argocdToken`:
**Required** ArgoCD token.
###  `argocdEndpoint`
 **Required** Entrypoint of ArgoCD applicatin (e.g https://argocd.example.com).
###  `destClusterName`
**Required** Destination cluster name.
###  `applicationName`
**Required** Name of the application to create/update/delete.
###  `helmChartName`
**Required** Name of Helm chart to apply.
###  `helmChartVersion`
**Required** Helm chart version to apply.
###  `helmRepoUrl`
**Required** Helm repository which holds application chart
###  `applicationNamespace`
Namespace where application is/will be deployed. (default: `"default"`).
### `argocdApplicationNamespace`
Namespace where ArgoCD application is/will be deployed. (default: `"default"`).
###  `applicationProject`
Project name where application should be deployed. (default: `""`)
###  `applicationParams`
Helm parameters of the application to create/update in format 'name=value;name=value;...'. (default: `""`)
### `applicationValueFiles`
Helm values files of the application to create/update in format 'values.yaml;values-production.yaml...'. (default: `""`)
###  `actionName`
One of create, read|get, update, delete. (default: `"create"`)
###  `maxRetry`
Max retry of the ArgoCD application creation. (default: `"15"`)
###  `tts`
Time To Sleep before each application status check. (default: `"10"`)
###  `doSync`
Do the action also sync at the end. (default: `true`)

## Outputs
### `application`

The application specs in JSON strigified aspec

## Example usage
```
uses: inarix/ga-argocd-action@v1
with:
  argocdToken: ${{secrets.ARGOCD_TOKEN}}
  argocdEndpoint: "https://argocd.example.com"
  argocdApplicationNamespace: "argocd"
  destClusterName: ${{secrets.CLUSTER_NAME}}
  applicationName: "nginx"
  helmChartName: "nginx"
  helmChartVersion: "9.7.0"
  helmRepoUrl: "https://charts.bitnami.com/bitnami"
  actionName: "create"
  applicationParams: "image.debug=true;replicaCount=2;nodeSelector.name=prod"
  applicationValueFiles: "values.yaml;values-staging.yaml"
```