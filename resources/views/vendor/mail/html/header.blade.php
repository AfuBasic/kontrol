@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Laravel' || trim($slot) === 'Kontrol')
<img src="{{ config('app.url') }}/assets/images/kontrol.png" class="logo" alt="Kontrol Logo" style="height: 36px; width: auto;">
@else
{!! $slot !!}
@endif
</a>
</td>
</tr>
