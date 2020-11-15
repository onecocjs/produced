{{#description}}
/** {{description}} */
{{/description}}
 interface {{name}} {
    {{#fields}}
        {{#description}}
        /** {{description}} */
        {{/description}}
        {{name}}:{{type}};
    {{/fields}}
}