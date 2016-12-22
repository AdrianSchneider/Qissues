export interface SerializedFilter {
  type: string,
  value: string
}

export default class Filter {
  public readonly type: string;
  public readonly value: string;

  constructor(type: string, value: string) {
    this.type = type;
    this.value = value;
  }

  public serialize(): SerializedFilter {
    return {
      type: this.type,
      value: this.value
    }
  }

  public static unserialize(data: SerializedFilter): Filter {
    return new Filter(data.type, data.value);
  }

  public static addSelectedTo(filters, type: string) {
    return item => filters.add(new Filter(type, item));
  }
}
