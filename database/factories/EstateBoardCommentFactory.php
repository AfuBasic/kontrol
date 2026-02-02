<?php

namespace Database\Factories;

use App\Models\Estate;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EstateBoardComment>
 */
class EstateBoardCommentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'estate_board_post_id' => EstateBoardPost::factory(),
            'estate_id' => Estate::factory(),
            'user_id' => User::factory(),
            'body' => fake()->paragraph(),
            'parent_id' => null,
        ];
    }

    /**
     * Indicate that the comment is a reply to another comment.
     */
    public function reply(EstateBoardComment $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => $parent->id,
            'estate_board_post_id' => $parent->estate_board_post_id,
            'estate_id' => $parent->estate_id,
        ]);
    }
}
