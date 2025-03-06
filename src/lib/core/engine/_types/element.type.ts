import type { TDateAsString } from '../../data-types/filter.interfaces';

type TIdKeyName = string;
export type TUniqueIdentifier = number | string; // string | number; //  `cuid-${string}`;
export type TGenericTableName = string;

export interface TTableDefinition {
    idkn: TIdKeyName;               // Id key name
}

export type TDatabaseTableDefinition<TableName extends string> = {
    [key in TableName]: TTableDefinition;
};

export type ReturnType2 = { [k: TIdKeyName]: TUniqueIdentifier; };

/**
 * The tables indirectly available to the user, 
 * eg. YtbChannel, YtbVideo, Configuration, NetworkConfigurationStore
 */
export type TDataParsers<TableName extends string> = {
    [key in TableName]: (
        value: TDateAsString<any>
    ) => any;
};

// ******************************************************************************
// *** Types
// ******************************************************************************
export type TCallback<ReturnType> = (
    value: ReadonlyArray<ReturnType>,
    // Only emit this change locally, not to the network
    internalOnly?: boolean,
) => void;

export type TAnyCallback<ReturnType> = (
    tableName: TGenericTableName,
    value: ReadonlyArray<ReturnType>,
) => void;