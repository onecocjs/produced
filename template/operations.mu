{{#ts}}
    {{.}}
{{/ts}}


{{#operations}}
{{#description}}
/** {{description}} */
{{/description}}

{{#requestTS}}
    {{requestTS}}
{{/requestTS}}

{{#responseTS}}
    {{responseTS}}
{{/responseTS}}

export function {{name}}(
    {{#request}}
    params:{{request}}
    {{/request}}
)
{{#response}}
:{{response}} 
{{/response}}
{
    return fetchGet(
        "{{{url}}}"
        {{#request}}
        ,params
        {{/request}}
    )
}
{{/operations}}