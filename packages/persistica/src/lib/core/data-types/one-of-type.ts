/* eslint-disable @typescript-eslint/naming-convention */
type ValueOf<Obj> = Obj[keyof Obj];
type OneOnly<Obj, Key extends keyof Obj> = { [key in Exclude<keyof Obj, Key>]+?: undefined } & Pick<Obj, Key>;
type OneOfByKey<Obj> = { [key in keyof Obj]: OneOnly<Obj, key> };

/**
 * A typescript utility type which will enforce only allow a single value to be set inside of a list of possible given interface types
 *
 * For example the following scenario will allow advanced translation types where we can enforce an either or scenario where a translation reference or a true value to be set
 * type IUltimatumBody =
 *  OneOfType<{
 *      headerRef: string;
 *      headerText: string;
 *  }>;
 *
 * If a user sets a headerRef as well headerText this will fail
 */
export type OneOfType<Obj> = ValueOf<OneOfByKey<Obj>>;
