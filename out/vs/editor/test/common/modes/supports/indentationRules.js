/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.luaIndentationRules = exports.latexIndentationRules = exports.htmlIndentationRules = exports.goIndentationRules = exports.phpIndentationRules = exports.rubyIndentationRules = exports.javascriptIndentationRules = void 0;
    exports.javascriptIndentationRules = {
        decreaseIndentPattern: /^((?!.*?\/\*).*\*\/)?\s*[\}\]\)].*$/,
        increaseIndentPattern: /^((?!\/\/).)*(\{([^}"'`]*|(\t|[ ])*\/\/.*)|\([^)"'`]*|\[[^\]"'`]*)$/,
        // e.g.  * ...| or */| or *-----*/|
        unIndentedLinePattern: /^(\t|[ ])*[ ]\*[^/]*\*\/\s*$|^(\t|[ ])*[ ]\*\/\s*$|^(\t|[ ])*[ ]\*([ ]([^\*]|\*(?!\/))*)?$/,
        indentNextLinePattern: /^((.*=>\s*)|((.*[^\w]+|\s*)(if|while|for)\s*\(.*\)\s*))$/,
    };
    exports.rubyIndentationRules = {
        decreaseIndentPattern: /^\s*([}\]]([,)]?\s*(#|$)|\.[a-zA-Z_]\w*\b)|(end|rescue|ensure|else|elsif)\b|(in|when)\s)/,
        increaseIndentPattern: /^\s*((begin|class|(private|protected)\s+def|def|else|elsif|ensure|for|if|module|rescue|unless|until|when|in|while|case)|([^#]*\sdo\b)|([^#]*=\s*(case|if|unless)))\b([^#\{;]|(\"|'|\/).*\4)*(#.*)?$/,
    };
    exports.phpIndentationRules = {
        increaseIndentPattern: /({(?!.*}).*|\(|\[|((else(\s)?)?if|else|for(each)?|while|switch|case).*:)\s*((\/[/*].*|)?$|\?>)/,
        decreaseIndentPattern: /^(.*\*\/)?\s*((\})|(\)+[;,])|(\]\)*[;,])|\b(else:)|\b((end(if|for(each)?|while|switch));))/,
    };
    exports.goIndentationRules = {
        decreaseIndentPattern: /^\s*(\bcase\b.*:|\bdefault\b:|}[)}]*[),]?|\)[,]?)$/,
        increaseIndentPattern: /^.*(\bcase\b.*:|\bdefault\b:|(\b(func|if|else|switch|select|for|struct)\b.*)?{[^}"'`]*|\([^)"'`]*)$/,
    };
    exports.htmlIndentationRules = {
        decreaseIndentPattern: /^\s*(<\/(?!html)[-_\.A-Za-z0-9]+\b[^>]*>|-->|\})/,
        increaseIndentPattern: /<(?!\?|(?:area|base|br|col|frame|hr|html|img|input|keygen|link|menuitem|meta|param|source|track|wbr)\b|[^>]*\/>)([-_\.A-Za-z0-9]+)(?=\s|>)\b[^>]*>(?!.*<\/\1>)|<!--(?!.*-->)|\{[^}"']*$/,
    };
    exports.latexIndentationRules = {
        decreaseIndentPattern: /^\s*\\end{(?!document)/,
        increaseIndentPattern: /\\begin{(?!document)([^}]*)}(?!.*\\end{\1})/,
    };
    exports.luaIndentationRules = {
        decreaseIndentPattern: /^\s*((\b(elseif|else|end|until)\b)|(\})|(\)))/,
        increaseIndentPattern: /^((?!(\-\-)).)*((\b(else|function|then|do|repeat)\b((?!\b(end|until)\b).)*)|(\{\s*))$/,
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50YXRpb25SdWxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2Rlcy9zdXBwb3J0cy9pbmRlbnRhdGlvblJ1bGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVuRixRQUFBLDBCQUEwQixHQUFHO1FBQ3pDLHFCQUFxQixFQUFFLHFDQUFxQztRQUM1RCxxQkFBcUIsRUFBRSxxRUFBcUU7UUFDNUYsbUNBQW1DO1FBQ25DLHFCQUFxQixFQUFFLDRGQUE0RjtRQUNuSCxxQkFBcUIsRUFBRSwwREFBMEQ7S0FDakYsQ0FBQztJQUVXLFFBQUEsb0JBQW9CLEdBQUc7UUFDbkMscUJBQXFCLEVBQUUsMEZBQTBGO1FBQ2pILHFCQUFxQixFQUFFLHFNQUFxTTtLQUM1TixDQUFDO0lBRVcsUUFBQSxtQkFBbUIsR0FBRztRQUNsQyxxQkFBcUIsRUFBRSxnR0FBZ0c7UUFDdkgscUJBQXFCLEVBQUUsNEZBQTRGO0tBQ25ILENBQUM7SUFFVyxRQUFBLGtCQUFrQixHQUFHO1FBQ2pDLHFCQUFxQixFQUFFLG9EQUFvRDtRQUMzRSxxQkFBcUIsRUFBRSxxR0FBcUc7S0FDNUgsQ0FBQztJQUVXLFFBQUEsb0JBQW9CLEdBQUc7UUFDbkMscUJBQXFCLEVBQUUsa0RBQWtEO1FBQ3pFLHFCQUFxQixFQUFFLHlMQUF5TDtLQUNoTixDQUFDO0lBRVcsUUFBQSxxQkFBcUIsR0FBRztRQUNwQyxxQkFBcUIsRUFBRSx3QkFBd0I7UUFDL0MscUJBQXFCLEVBQUUsNkNBQTZDO0tBQ3BFLENBQUM7SUFFVyxRQUFBLG1CQUFtQixHQUFHO1FBQ2xDLHFCQUFxQixFQUFFLCtDQUErQztRQUN0RSxxQkFBcUIsRUFBRSx1RkFBdUY7S0FDOUcsQ0FBQyJ9