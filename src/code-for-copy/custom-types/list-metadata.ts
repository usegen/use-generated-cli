import { Field, ObjectType } from "@nestjs/graphql";


@ObjectType()
export class ListMetadata {
  @Field(() => Number, {nullable:false})
  count!: number;
}