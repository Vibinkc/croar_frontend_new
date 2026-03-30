export const LANGUAGE_CONFIG: { [key: string]: { name: string, ext: string, boilerplate: string } } = {
    python: {
        name: 'Python',
        ext: '.py',
        boilerplate: 'def solution():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solution()',
    },
    javascript: {
        name: 'JavaScript',
        ext: '.js',
        boilerplate: 'function solution() {\n    // Write your solution here\n}\n\nsolution();',
    },
    typescript: {
        name: 'TypeScript',
        ext: '.ts',
        boilerplate: 'function solution(): void {\n    // Write your solution here\n}\n\nsolution();',
    },
    java: {
        name: 'Java',
        ext: '.java',
        boilerplate: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}',
    },
    cpp: {
        name: 'C++',
        ext: '.cpp',
        boilerplate: '#include <iostream>\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
    },
    go: {
        name: 'Go',
        ext: '.go',
        boilerplate: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n}',
    },
    ruby: {
        name: 'Ruby',
        ext: '.rb',
        boilerplate: 'def solution\n    # Write your solution here\nend\n\nsolution',
    },
    php: {
        name: 'PHP',
        ext: '.php',
        boilerplate: '<?php\n\nfunction solution() {\n    // Write your solution here\n}\n\nsolution();\n?>',
    }
};
