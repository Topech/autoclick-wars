declare module 'sql.js' {
  interface Database {
    exec(sql: string): { columns: string[]; values: any[][] }[];
    run(sql: string, params?: any[]): void;
    export(): Uint8Array;
  }

  interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  function initSqlJs(config?: { locateFile: (file: string) => string }): Promise<SqlJsStatic>;

  export = initSqlJs;
}
