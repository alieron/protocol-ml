CodeMirror.defineMode('protocol-ml', function () {
    return {
        startState: function () { return { inString: false }; },
        token: function (stream, state) {
            // String continuation
            if (state.inString) {
                if (stream.skipTo('"')) {
                    stream.next();
                    state.inString = false;
                } else {
                    stream.skipToEnd();
                }
                return 'pml-label';
            }

            // String start
            if (stream.peek() === '"') {
                stream.next();
                state.inString = true;
                return 'pml-label';
            }

            // Whitespace
            if (stream.eatSpace()) return null;

            // Comments
            if (stream.match('//')) {
                stream.skipToEnd();
                return 'pml-comment';
            }

            // @number position
            if (stream.match(/@(\d+(\.\d+)?)/)) return 'pml-at';

            // Arrow types
            if (stream.match('->')) return 'pml-arrow-normal';
            if (stream.match('=>')) return 'pml-arrow-thick';
            if (stream.match('~>')) return 'pml-arrow-corrupt';
            if (stream.match('-x')) return 'pml-arrow-dropped';

            // Annotation sides
            if (stream.match(/[<>]/)) return 'pml-side';

            // Keywords
            if (stream.match(/\b(def|participant)\b/)) return 'pml-keyword';

            // Numbers with optional unit
            if (stream.match(/\d+(\.\d+)?(px|em|rem|%)?/)) return 'pml-value';

            stream.next();
            return null;
        }
    };
});
